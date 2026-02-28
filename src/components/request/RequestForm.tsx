import React from "react";
import { useDispatch } from "react-redux";
import { updateActivity } from "../../state/activitiesSlice";
import { useRequestFormState } from "../../hooks/useRequestFormState";
import { networkUtils } from "../../utils/network";
import MethodSelect from "./MethodSelect";
import UrlInput from "./UrlInput";
import HeadersEditor from "./HeadersEditor";
import BodyEditor from "./BodyEditor";
import type { BodyType } from "../../consts";
import "./RequestForm.css";

function substituteVariables(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, name) => variables[name] ?? `{{${name}}}`);
}

const RequestForm: React.FC<{
  selectedId: string | null;
  setAIExplanation: (s: string) => void;
}> = ({ selectedId: _selectedId, setAIExplanation }) => {
  const dispatch = useDispatch();
  const {
    method,
    setMethod,
    url,
    setUrl,
    headers,
    setHeaders,
    body,
    setBody,
    activity,
  } = useRequestFormState();

  const [bodyType, setBodyType] = React.useState<BodyType>("json");
  const [variables, setVariables] = React.useState<Record<string, string>>({});
  const prevRequestRef = React.useRef<string>("");

  // Autosave on change (debounced)
  React.useEffect(() => {
    if (!activity?.id) return;

    const handle = setTimeout(() => {
      const nextRequest = {
        ...activity.request,
        method,
        url,
        headers,
        body: bodyType === "none" ? "" : body,
      };
      const serialized = JSON.stringify(nextRequest);
      if (serialized === prevRequestRef.current) return;

      prevRequestRef.current = serialized;

      dispatch(
        updateActivity({
          id: activity.id,
          data: {
            url,
            request: nextRequest,
          },
        })
      );
    }, 300);

    return () => clearTimeout(handle);
  }, [method, url, headers, body, bodyType, activity, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const substitutedBody =
      bodyType !== "none"
        ? substituteVariables(body, variables)
        : "";

    let finalBody = substitutedBody;
    if (bodyType === "json" && finalBody.trim()) {
      try {
        JSON.parse(finalBody);
      } catch {
        alert("Body must be valid JSON");
        return;
      }
    }

    const reqData = {
      method,
      url,
      headers,
      body: finalBody,
    };

    if (activity && activity.id) {
      dispatch(
        updateActivity({
          id: activity.id,
          data: {
            url,
            request: {
              ...activity.request,
              method,
              url,
              headers,
              body: bodyType === "none" ? "" : body,
            },
          },
        })
      );
    }

    await networkUtils.sendHttpRequest(
      reqData,
      activity?.id,
      activity?.name,
      dispatch as any,
      setAIExplanation
    );
  };

  return (
    <form className="p-4 rounded mb-4" onSubmit={handleSubmit}>
      <div className="mb-2 flex items-end gap-2">
        <MethodSelect method={method} onChange={setMethod} />
        <UrlInput url={url} onChange={setUrl} />
      </div>

      <HeadersEditor headers={headers} onChange={setHeaders} />

      <BodyEditor
        body={body}
        bodyType={bodyType}
        variables={variables}
        onBodyChange={setBody}
        onBodyTypeChange={setBodyType}
        onVariablesChange={setVariables}
      />

      <button
        type="submit"
        className="bg-accent text-white font-bold px-4 py-2 rounded-sm border-2 border-gray-400 hover:bg-cyan-950"
      >
        Send Request
      </button>
    </form>
  );
};

export default RequestForm;
