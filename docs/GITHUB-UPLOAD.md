# Uploading the source to GitHub

This source folder already includes a README, setup instructions, an empty environment example and judge documentation. Upload the source files themselves, not only the ZIP.

1. Extract the ZIP and open `GyanSetu-Upgrade`.
2. In your GitHub account, create a new repository, for example `gyansetu`. Choose visibility according to the organizers' submission rule. Do not add another README or license during creation because the source already has its README and no project-wide license has been selected.
3. Use **Upload files** and drag the extracted folder's contents, preserving `api/`, `assets/`, `lib/`, `tests/`, `evaluation/` and `docs/`. `README.md`, `index.html`, `package.json` and `vercel.json` should appear at the repository root.
4. Commit the upload, open the rendered README, then verify `api/chat.js` and `assets/logo.png` are present.
5. Share the actual repository URL with the judges. A GitHub source upload does not automatically update the deployed app.

Keep `.gitignore` and the blank `.env.example`. Never add real `.env.local`, provider keys, `node_modules/` or `.vercel/` account settings.

For a local Git workflow, authenticate using your normal GitHub method, create an empty repository, then run in the extracted project folder:

```sh
git init -b main
git add .
git commit -m "Add GyanSetu 8.2.5 source and hackathon documentation"
git remote add origin REPOSITORY_URL
git push -u origin main
```

Replace `REPOSITORY_URL` with the exact clone URL shown by your new repository. If the folder already has Git history or an `origin`, inspect it before running initialization or adding a remote.

Official reference: [Adding locally hosted code to GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).
