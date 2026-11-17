# PLANET collab site

> 🚧 **Work in progress.** This is the prototype member home and public site for [PLANET](https://github.com/The-Open-Co-op/planet), the flagship project of [The Open Co-op](https://open.coop). Live at [collab.open.coop](https://collab.open.coop/).

## What's here

- Public site and member home (Next.js)
- Demo pages: each `/demo/[slug]` embeds an interactive demo from the [`planet`](https://github.com/The-Open-Co-op/planet) UI prototype in an iframe, with a feedback panel alongside
- Newsletter and member signup (Brevo)
- Supabase schema and migrations (`supabase/`)

## Run it locally

```sh
npm install
npm run dev
```

You'll need the environment variables (Supabase, Brevo, NextAuth, GitHub, Open Collective) in a local `.env.local`, which is not committed.

## License

Content is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Code is licensed under [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.en.html).
