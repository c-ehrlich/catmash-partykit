// cje-test-ria5
// dataset asdf
// token xaat-20d4ee8b-8a26-465d-bb41-f705a9e4e495

import { AxiomWithoutBatching } from "@axiomhq/js";

export class AxiomLogger {
  private axiom: AxiomWithoutBatching;
  private dataset: string;

  constructor({
    dataset,
    token,
    orgId,
  }: {
    dataset: string;
    token: string;
    orgId: string;
  }) {
    this.axiom = new AxiomWithoutBatching({ token, orgId });
    this.dataset = dataset;
  }

  log(data: Record<string, any>) {
    this.axiom.ingest(this.dataset, data);
  }
}
