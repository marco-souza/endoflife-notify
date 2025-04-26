# Objective

Get notified X days before a given tech expires

## Usecases
- As an user, I wan't to be notified 30 days before Node lts
 is about to expire

## End of life data format

We can fetch data form the API calling `https://endoflife.date/api/nodejs.json`

```json
[
  {
    "cycle": "23",
    "releaseDate": "2024-10-16",
    "eol": "2025-06-01",
    "latest": "23.11.0",
    "latestReleaseDate": "2025-04-01",
    "lts": false,
    "support": "2025-04-01",
    "extendedSupport": false
  }
]
```

## Usage

```sh
deno task start
```
