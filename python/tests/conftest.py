import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sidecar import config
from sidecar.api import api
from sidecar.projects import service as projects_service
from sidecar.settings import service as settings_service


@pytest.fixture
def fixtures_dir():
    return Path(__file__).parent / "fixtures"


@pytest.fixture
def setup_project_path_storage(monkeypatch, tmp_path):
    user_id = "user1"
    project_id = "project1"
    project_name = "project1name"
    monkeypatch.setattr(projects_service, "WEB_STORAGE_URL", tmp_path)
    projects_service.create_project(user_id, project_id, project_name)
    return user_id, project_id


@pytest.fixture
def setup_project_with_uploads(monkeypatch, tmp_path, fixtures_dir):
    user_id = "user1"
    project_id = "project1"
    project_name = "project1name"
    monkeypatch.setattr(projects_service, "WEB_STORAGE_URL", tmp_path)

    projects_service.create_project(user_id, project_id, project_name)
    project_path = projects_service.get_project_path(user_id, project_id)

    client = TestClient(api)
    client.post(f"/fs/{project_id}/uploads", files={"file": ("file1.txt", "content")})

    # create a file
    filename = "uploads/test.pdf"
    project_path / filename

    with open(f"{fixtures_dir}/pdf/test.pdf", "rb") as f:
        _ = client.put(
            f"/{project_id}/{filename}",
            files={"file": ("test.pdf", f, "application/pdf")},
        )


@pytest.fixture
def setup_uploaded_reference_pdfs(monkeypatch, tmp_path, fixtures_dir):
    monkeypatch.setattr(config, "WEB_STORAGE_URL", tmp_path)

    # create a project
    user_id = "user1"
    project_id = "project1"
    _ = projects_service.create_project(user_id, project_id)

    # create a file
    filename = "uploads/test.pdf"

    client = TestClient(api)

    with open(f"{fixtures_dir}/pdf/test.pdf", "rb") as f:
        _ = client.put(
            f"/fs/{project_id}/{filename}",
            files={"file": ("test.pdf", f, "application/pdf")},
        )


@pytest.fixture
def create_settings_json(monkeypatch, tmp_path, request):
    monkeypatch.setattr(config, "WEB_STORAGE_URL", tmp_path)

    user_id = "user1"
    filepath = settings_service.make_settings_json_path(user_id)

    settings_service.initialize_settings_for_user(user_id)

    defaults = settings_service.default_settings()
    defaults.openai_api_key = "1234"

    with open(filepath, "w") as f:
        json.dump(defaults.dict(), f)

    def teardown():
        filepath.unlink()

    request.addfinalizer(teardown)


@pytest.fixture
def mock_call_model_is_ok(*args, **kwargs):
    def mock_call_model_response(*args, **kwargs):
        return {
            "choices": [
                {
                    "finish_reason": "stop",
                    "index": 0,
                    "message": {
                        "content": "This is a mocked response",
                        "role": "assistant",
                    },
                }
            ],
            "created": 1685588892,
            "id": "chatcmpl-somelonghashedstring",
            "model": "gpt-3.5-turbo-0301",
            "object": "chat.completion",
            "usage": {
                "completion_tokens": 121,
                "prompt_tokens": 351,
                "total_tokens": 472,
            },
        }

    return mock_call_model_response


@pytest.fixture
def mock_call_model_is_error(*args, **kwargs):
    def mock_call_model_response(*args, **kwargs):
        raise Exception("This is a mocked error")

    return mock_call_model_response


@pytest.fixture
def mock_search_paper(*args, **kwargs):
    from sidecar.search.schemas import S2SearchResult, SearchResponse
    from sidecar.typing import ResponseStatus

    def mock_search_paper_response(*args, **kwargs):
        response = SearchResponse(
            status=ResponseStatus.OK,
            message="",
            results=[
                S2SearchResult(
                    title="Sample Paper Title",
                    abstract="Sample Abstract",
                    venue="Sample Venue",
                    year=2021,
                    paperId="sample-id-1",
                    citationCount=10,
                    openAccessPdf="https://sample1.pdf",
                    authors=["author1", "author2", "author3"],
                ),
                S2SearchResult(
                    title="Sample Paper Title 2",
                    abstract="Sample Abstract 2",
                    venue="Sample Venue 2",
                    year=2022,
                    paperId="sample-id-2",
                    citationCount=20,
                    openAccessPdf="https://sample2.pdf",
                    authors=["author1", "author2", "author3"],
                ),
            ],
        )
        return response

    return mock_search_paper_response
