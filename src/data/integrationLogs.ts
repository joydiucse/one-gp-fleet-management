export interface IntegrationLog {
  id: string;
  timestamp: string;
  direction: "Inbound" | "Outbound";
  payloadType: string;
  referenceId: string;
  status: "Success" | "Failed" | "Retried";
  message: string;
}
