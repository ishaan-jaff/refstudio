from pathlib import Path

from sidecar import config
from sidecar.ai import chat
from sidecar.ai.schemas import ChatRequest

from ..helpers import _copy_fixture_to_temp_dir


def test_chat_ask_question_is_ok(
    monkeypatch, tmp_path, mock_call_model_is_ok, fixtures_dir
):
    monkeypatch.setattr(chat.Chat, "call_model", mock_call_model_is_ok)

    # copy references.json to temp dir and mock settings.REFERENCES_JSON_PATH
    test_file = f"{fixtures_dir}/data/references.json"
    path_to_test_file = Path(__file__).parent.joinpath(test_file)
    mocked_path = tmp_path.joinpath("references.json")

    _copy_fixture_to_temp_dir(path_to_test_file, mocked_path)
    monkeypatch.setattr(config, "REFERENCES_JSON_PATH", mocked_path)

    response = chat.ask_question(
        request=ChatRequest(text="This is a question about something"),
    )
    output = response.dict()

    assert output["status"] == "ok"
    assert output["message"] == ""
    assert len(output["choices"]) == 1
    assert output["choices"][0]["index"] == 0


def test_chat_ask_question_is_openai_error(
    monkeypatch, tmp_path, mock_call_model_is_error, fixtures_dir
):
    monkeypatch.setattr(chat.Chat, "call_model", mock_call_model_is_error)

    # copy references.json to temp dir and mock settings.REFERENCES_JSON_PATH
    test_file = f"{fixtures_dir}/data/references.json"
    path_to_test_file = Path(__file__).parent.joinpath(test_file)
    mocked_path = tmp_path.joinpath("references.json")

    _copy_fixture_to_temp_dir(path_to_test_file, mocked_path)
    monkeypatch.setattr(config, "REFERENCES_JSON_PATH", mocked_path)

    response = chat.ask_question(
        request=ChatRequest(text="This is a question about something"),
    )
    output = response.dict()

    assert output["status"] == "error"
    assert output["message"] == "This is a mocked error"
    assert len(output["choices"]) == 0
