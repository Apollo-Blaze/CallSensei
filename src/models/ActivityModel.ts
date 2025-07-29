import type { RequestModel } from "./RequestModel";
import type { ResponseModel } from "./ResponseModel";

export interface ActivityModel {
  id: string;
  name: string;
  url: string;
  request: RequestModel;
  response?: ResponseModel;
}

export function createActivity(
  id :string,
  name: string,
  url:string,
  request: RequestModel,
  response?: ResponseModel
): ActivityModel {
  return {

    id:id ||  Math.random().toString(36).substr(2, 9),
    name: name || request.name || '',
    url: url || request.url || '',
    request,
    response,
  };
} 