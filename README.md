# End of Life Notify

![Deno](https://img.shields.io/badge/deno-v1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Build](https://img.shields.io/badge/build-passing-brightgreen)

## Objective

- As a user, I want to be notified 30 days before Node LTS expires.

## End of Life Data Format

We can fetch data using `https://endoflife.date/api/`.

## Usage

We have the following endpoints:

```sh
GET / # documentation

POST /subscribe/:tech # subscribe a webhook to given tech
# body
{
  "version": 20,
  "days_before_expire": 30,
  "webhook_url": "https://my_webhook_url.com/callback",
  "webhook_secret": "super-secret"
}
```

Once your target date is reached, eol-notify will call your endpoint:

```sh
GET https://my_webhook_url.com/callback

# headers
Content-Type: application/json
User-Agent: eol-notify
Authorization: Bearer ${webhook_secret},

# body
{
  "version": 20,
  "days_before_expire": 30,
  "webhook_url": "https://my_webhook_url.com/callback",
  "webhook_secret": "super-secret"
}
```

## Local Development

In case you want to run it locally, you need to have Deno installed!

```sh
git clone https://github.com/marco-souza/endoflife-notify.git
cd endoflife-notify

deno install
deno task start
```

Here is an example of the subscription:

```sh
deno task start

# subscribe
curl http://localhost:8000/subscribe/nodejs -X POST -d '{
  "version": 20,
  "days_before_expire": 30,
  "webhook_url": "http://localhost:8000/callback",
  "webhook_secret": "super-secret"
}'
```

## References

Here are some important links related to this project:

- [Deno](https://deno.land/): A modern runtime for JavaScript and TypeScript.
- [End of Life Date](https://endoflife.date/): Provides information about the end of life dates for various software.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.

