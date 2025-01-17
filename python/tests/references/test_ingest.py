import json
import os
from datetime import date
from pathlib import Path
from uuid import uuid4

from sidecar import config
from sidecar.references import ingest, storage
from sidecar.references.schemas import Author, IngestRequest, IngestStatus, Reference


def _copy_fixture_to_temp_dir(source_path: Path, write_path: Path) -> None:
    """
    Copies test fixtures (pdfs, xml) to a temporary directory
    for testing. This is because `ingest` creates additional
    directories and files which should be cleaned after the test.
    """
    if not write_path.parent.exists():
        write_path.parent.mkdir()

    with open(source_path, "rb") as f:
        file_bytes = f.read()
    with open(write_path, "wb") as f:
        f.write(file_bytes)


def test_run_ingest(monkeypatch, tmp_path, fixtures_dir):
    # directories where ingest will write files
    staging_dir = tmp_path.joinpath(".staging")
    grobid_output_dir = tmp_path.joinpath(".grobid")
    json_storage_dir = tmp_path.joinpath(".storage")

    # copy test PDFs to temp dir
    path = Path(f"{fixtures_dir}/pdf/")
    for pdf in path.glob("*.pdf"):
        write_path = tmp_path.joinpath("uploads", pdf.name)
        _copy_fixture_to_temp_dir(pdf, write_path)

    monkeypatch.setattr(config, "UPLOADS_DIR", tmp_path.joinpath("uploads"))

    # grobid server takes an input directory of PDFs
    # if grobid successfully parses the file, it creates a {pdfname}.tei.xml file
    # if grobid fails to parse the file, it creates a {pdfname}_{errorcode}.txt file
    # mock this by copying the test xml to the output directory
    def mock_grobid_client_process(*args, **kwargs):
        path = Path(f"{fixtures_dir}/xml/")
        for file_ in path.glob("*"):
            write_path = grobid_output_dir.joinpath(file_.name)
            _copy_fixture_to_temp_dir(file_, write_path)

    monkeypatch.setattr(ingest.GrobidClient, "process", mock_grobid_client_process)

    pdf_directory = tmp_path.joinpath("uploads")
    response = ingest.run_ingest(IngestRequest(pdf_directory=str(pdf_directory)))

    # project name is the name of the parent directory of the input directory
    assert response.project_name == tmp_path.name

    # check that the expected number of references were parsed
    assert len(response.references) == 2

    # sort references by source_filename so list order is consistent
    references = sorted(response.references, key=lambda x: x.source_filename)

    # check that grobid-fails.pdf is contained in the reference output
    assert references[0].source_filename == "grobid-fails.pdf"
    assert references[0].citation_key == "untitled"

    # check that grobid failures have text extracted
    assert len(references[0].contents) > 0
    assert len(references[0].chunks) > 0

    # check that test.pdf was parsed correctly
    assert references[1].title == "A Few Useful Things to Know about Machine Learning"
    assert references[1].doi is None
    assert len(references[1].authors) == 1
    assert references[1].authors[0].full_name == "Pedro Domingos"
    assert references[1].citation_key == "domingos"

    # check that all temporary files were cleaned up ...
    assert len(os.listdir(staging_dir)) == 0
    assert len(os.listdir(grobid_output_dir)) == 0
    assert len(os.listdir(json_storage_dir)) == 1

    # ... except for the references.json file
    references_json_path = json_storage_dir.joinpath("references.json")
    assert references_json_path.exists()

    # references.json should contain the same references in stdout
    with open(references_json_path, "r") as f:
        assert json.load(f) == response.dict()["references"]


def test_ingest_add_citation_keys(monkeypatch, tmp_path):
    ingestion = ingest.PDFIngestion(input_dir=tmp_path)

    # set up base reference with required fields
    # we'll be copying this reference and modifying it for each test
    base_reference = Reference(
        id=str(uuid4()), source_filename="test.pdf", status="complete"
    )
    fake_data = [
        {
            "full_name": "John Smith",
            "published_date": None,
            "expected_citation_key": "smith",
        },
        {
            "full_name": "Kathy Jones",
            "published_date": date(2021, 1, 1),
            "expected_citation_key": "jones2021",
        },
        {
            "full_name": "Jane Doe",
            "published_date": date(2022, 1, 1),
            "expected_citation_key": "doe2022",
        },
    ]

    # test: references with different authors
    # expect: should have unique citation keys
    refs = []
    for d in fake_data:
        reference = base_reference.copy()
        reference.authors = [Author(full_name=d["full_name"])]
        reference.published_date = d["published_date"]
        refs.append(reference)

    tested = ingestion._add_citation_keys(refs)

    for ref, d in zip(tested, fake_data):
        assert ref.citation_key == d["expected_citation_key"]

    # test: references with no author and no published year
    # expect: should have citation key "untitled" appeneded with a number
    refs = []
    for i in range(5):
        reference = base_reference.copy()
        reference.authors = []
        refs.append(reference)

    tested = ingestion._add_citation_keys(refs)

    for i, ref in enumerate(tested):
        if i == 0:
            assert ref.citation_key == "untitled"
        else:
            assert ref.citation_key == f"untitled{i - 1 + 1}"

    # test: references with no author but with published years
    # expect: should have citation key "untitled" appeneded with the year
    refs = []
    for i in range(3):
        reference = base_reference.copy()
        reference.published_date = date(2020 + i, 1, 1)
        reference.authors = []
        refs.append(reference)

    tested = ingestion._add_citation_keys(refs)

    for i, ref in enumerate(tested):
        assert ref.citation_key == f"untitled{ref.published_date.year}"

    # test: references with no author and duplicate published years
    # expect: should have citation key "untitled" appeneded with year and a letter
    refs = []
    for i in range(3):
        reference = base_reference.copy()
        reference.published_date = date(2020, 1, 1)
        reference.authors = []
        refs.append(reference)

    tested = ingestion._add_citation_keys(refs)

    for i, ref in enumerate(tested):
        if i == 0:
            expected = f"untitled{ref.published_date.year}"
        else:
            expected = f"untitled{ref.published_date.year}{chr(97 + i)}"
        assert ref.citation_key == expected

    # test: references with same author last name and no published year
    # expect: should have citation key of author's last name appended with a letter
    refs = []
    for i in range(3):
        reference = base_reference.copy()
        reference.authors = [Author(full_name="John Smith")]
        refs.append(reference)

    tested = ingestion._add_citation_keys(refs)

    for i, ref in enumerate(tested):
        if i == 0:
            assert ref.citation_key == "smith"
        else:
            assert ref.citation_key == f"smith{chr(97 + i)}"

    # test: references with same author and same published years
    # expect: should have citation key of author's last name + year + letter
    refs = []
    for i in range(3):
        reference = base_reference.copy()
        reference.published_date = date(2021, 1, 1)
        reference.authors = [Author(full_name="John Smith")]
        refs.append(reference)

    tested = ingestion._add_citation_keys(refs)

    ## should be smith2021a, smith2021b, smith2021c
    for i, ref in enumerate(tested):
        if i == 0:
            assert ref.citation_key == "smith2021"
        else:
            assert ref.citation_key == f"smith2021{chr(97 + i)}"

    # test: ingesting new references should not modify existing citation keys
    # expect: previously created citation keys should be unchanged ...
    #   ... but new references should have unique citation keys
    existing_refs = [
        Reference(
            id=str(uuid4()),
            source_filename="test.pdf",
            status=IngestStatus.PROCESSING,
            authors=[Author(full_name="Kathy Jones")],
            published_date=date(2021, 1, 1),
            citation_key="jones2021",
        ),
        Reference(
            id=str(uuid4()),
            source_filename="test.pdf",
            status=IngestStatus.PROCESSING,
            authors=[Author(full_name="Kathy Jones")],
            published_date=date(2021, 1, 1),
            citation_key="jones2021a",
        ),
        Reference(
            id=str(uuid4()),
            source_filename="test.pdf",
            status=IngestStatus.PROCESSING,
            authors=[Author(full_name="John Smith")],
            citation_key="smith",
        ),
        Reference(
            id=str(uuid4()),
            source_filename="test.pdf",
            status=IngestStatus.PROCESSING,
            citation_key="untitled",
        ),
        Reference(
            id=str(uuid4()),
            source_filename="test.pdf",
            status=IngestStatus.PROCESSING,
            citation_key="untitled1",
        ),
    ]
    new_refs = [
        Reference(
            id=str(uuid4()),
            source_filename="test.pdf",
            status=IngestStatus.PROCESSING,
            authors=[Author(full_name="Kathy Jones")],
            published_date=date(2021, 1, 1),
        ),
        Reference(
            id=str(uuid4()),
            source_filename="test.pdf",
            status=IngestStatus.PROCESSING,
            authors=[Author(full_name="John Smith")],
        ),
        Reference(
            id=str(uuid4),
            source_filename="test.pdf",
            status=IngestStatus.PROCESSING,
        ),
    ]
    monkeypatch.setattr(ingestion, "references", existing_refs)

    tested = ingestion._add_citation_keys(new_refs)
    new_keys = sorted([ref.citation_key for ref in tested])

    assert new_keys == sorted(["jones2021b", "smitha", "untitled2"])


def test_ingest_get_statuses(monkeypatch, fixtures_dir):
    monkeypatch.setattr(ingest, "UPLOADS_DIR", Path(f"{fixtures_dir}/pdf"))
    # ingest.UPLOADS_DIR = f"{fixtures_dir}/pdf"

    # test: JsonStorage path does not exist
    # expect: all `uploads` are in process
    jstore = storage.JsonStorage("does_not_exist.json")
    fetcher = ingest.IngestStatusFetcher(storage=jstore)
    response = fetcher.emit_statuses()

    statuses = response.reference_statuses

    assert response.status == "ok"
    assert len(statuses) == 2
    for ref in statuses:
        ref.status == "processing"

    # test: stored references should be checked against uploads
    # expect: stored references return stored status,
    #   uploads (not yet stored) return processeding
    mock_references = [
        Reference(
            id=str(uuid4()),
            source_filename="completed.pdf",
            status=IngestStatus.COMPLETE,
        ),
        Reference(
            id=str(uuid4()),
            source_filename="failed.pdf",
            status=IngestStatus.FAILURE,
        ),
    ]
    mock_uploads = [
        Path("completed.pdf"),  # retain mock_reference.status
        Path("failed.pdf"),  # retain mock_reference.status
        Path("not_yet_processed.pdf"),  # not in mock_reference -> `processing`
    ]

    def mock_storage_load(*args, **kwargs):
        # do nothing since we also mock references propery
        pass

    jstore = storage.JsonStorage("to_be_mocked.json")
    monkeypatch.setattr(jstore, "load", mock_storage_load)
    monkeypatch.setattr(jstore, "references", mock_references)

    fetcher = ingest.IngestStatusFetcher(storage=jstore)
    monkeypatch.setattr(fetcher, "uploads", mock_uploads)

    response = fetcher.emit_statuses()

    statuses = response.reference_statuses

    assert response.status == "ok"
    assert len(statuses) == 3
    for ref in statuses:
        if ref.source_filename == "completed.pdf":
            ref.status == "completed"
        elif ref.source_filename == "failed.pdf":
            ref.status == "failure"
        else:
            ref.status == "processing"

    # test: Exception on storage load should return error status
    # expect: response status = error, ref statuses = []
    def mock_storage_load_raises_exception(*args, **kwargs):
        raise Exception

    monkeypatch.setattr(jstore, "load", mock_storage_load_raises_exception)
    response = fetcher.emit_statuses()

    statuses = response.reference_statuses

    assert response.status == "error"
    assert len(statuses) == 0
