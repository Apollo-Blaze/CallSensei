import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../state/store";
import type { ActivityModel } from "../../models/ActivityModel";

const ResponseViewer: React.FC = () => {
  const selectedActivity = useSelector((state: RootState) =>
    state.activities.activities.find(
      (activity: ActivityModel) => activity.id === state.activities.selectedActivityId
    )
  );

  if (!selectedActivity || !selectedActivity.response) {
    return <div className="bg-darkblue-light p-4 rounded">No response yet.</div>;
  }

  const response = selectedActivity.response;
  console.log("inside response component",response.toString());

  return (
    <div className="bg-darkblue-light p-4 rounded mt-4">
      <h3 className="text-lg font-semibold mb-2">Response</h3>
      <div className="mb-2">Status: <span className="font-mono">{response.status} {response.statusText}</span></div>
      <div className="mb-2">Headers:
        <pre className="bg-darkblue p-2 rounded text-xs overflow-x-auto">{JSON.stringify(response.headers, null, 2)}</pre>
      </div>
      <div>Body:
        <pre className="bg-darkblue p-2 rounded text-xs overflow-x-auto">{response.body}</pre>
      </div>
    </div>
  );
};

export default ResponseViewer; 