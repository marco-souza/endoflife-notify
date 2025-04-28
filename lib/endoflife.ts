import { type } from "arktype";

const EndOfLife = type({
  releaseDate: "string.date.parse",
  latest: "string.semver",
  latestReleaseDate: "string.date.parse",
  extendedSupport: "boolean",
  support: "false | string.date.parse",
  eol: "true | string.date.parse",
  lts: "false | string.date.parse",
});

class APIClient {
  constructor(private base_url = "https://endoflife.date/api") {}

  async singleCycleDetails(
    { tech, version: cycle }: { tech: string; version: number },
  ) {
    const url = `${this.base_url}/${tech}/${cycle}.json`;
    console.info(`Fetching data from ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch data for ${tech}: ${res.statusText}`);
      throw new Error(`Failed to fetch data for ${tech}`);
    }

    const data = await res.json();
    const eol = EndOfLife(data);
    if (eol instanceof type.errors) {
      console.error(`Invalid data format`, eol);
      throw new Error(`Invalid data format: ${eol.summary}`);
    }

    return eol;
  }
}

export const apiClient = new APIClient();
