# Administrator guide

This guide is for college staff with the `admin` role. The dashboard is Bangla-first; many labels also appear in English when the site language is switched.

## Signing in

1. Go to `/login`.
2. Enter the administrator e-mail and password provisioned from `.env` (or created later by another administrator).
3. Change the bootstrap password from **ড্যাশবোর্ড → অ্যাকাউন্ট ও পাসওয়ার্ড** after the first sign-in.

There is no public sign-up and no “make me admin” flow. Role changes happen only in **ব্যবহারকারী ও ভূমিকা** by an existing administrator.

## Dashboard map

| Menu | Use it for |
| --- | --- |
| সংক্ষিপ্তসার (Overview) | Counts, recent audit activity, new messages, upcoming events, quick actions, demo-content warning. |
| নোটিশ | Draft/publish/archive notices; pin important notices; choose audience and session; attach a URL. |
| ইভেন্ট | Event dates, times, venue, registration information, publishing. |
| শিক্ষক | Teacher profile records, designation, department, category, employment type, assigned sessions. |
| শিক্ষার্থী | Student records: student ID, roll, registration, session, programme, group, subjects, contact details. |
| ফলাফল | Examinations, manual results, CSV validation/import, draft/review/publish/archive. |
| একাডেমিক | Sessions, programmes, subjects, routines, examinations, calendar items. |
| ডকুমেন্ট | Upload and publish PDF/images/office/text files; archive instead of deleting. |
| যোগাযোগ বার্তা | Read/archive/delete contact messages; deletion creates a backup. |
| ব্যবহারকারী ও ভূমিকা | Create accounts, link teacher/student records, reset links, activate/deactivate. |
| সাইট সেটিংস | Institution, content, admission text, goals, facilities, achievements, backups, demo cleanup. |
| অডিট লগ | Read-only record of administrative actions. |

## Content workflow

- **Draft**: visible only in the dashboard.
- **Published**: visible on the public site (subject to its own page rules).
- **Archived**: hidden from the public site, retained for records.
- Notices and events have explicit status controls. Use archive rather than trying to delete permanent records.
- Mark any demonstration text clearly. The seed data uses **নমুনা** and a visible demo badge. Remove sample notices/events/calendar entries from **সাইট সেটিংস** when real content is ready.
- Do not replace verification-pending copy with guesses. If the college has not supplied an official fact, leave the pending wording or ask the authority.

## Teachers and students

1. Create the teacher or student record first.
2. Create the account in **ব্যবহারকারী ও ভূমিকা**.
3. Choose the role (`teacher` or `student`) and link the correct record.
4. Give a strong temporary password and leave **পাসওয়ার্ড পরিবর্তন করতে হবে** enabled.
5. The user signs in and changes the password. If they lose it, generate a one-time reset link from user management and deliver it through a safe channel.

Students cannot change their roll, registration, session, programme, group or status. Only administrators can edit those fields.

## Result publication

1. Create or confirm the **examination** under **একাডেমিক → পরীক্ষা**.
2. Add results manually or import a CSV.
3. Validate the CSV before importing. Fix every reported error.
4. Choose duplicate handling:
   - **Skip** keeps existing results.
   - **Overwrite** replaces them; confirmation is required and a backup is created first.
5. Leave results as **draft** until checked.
6. Publish the examination, then publish the results. A result cannot be published while its examination is still a draft.
7. Verify the public `/results` lookup with a test roll/registration before announcing results.

### CSV columns

```text
roll,registration,studentName,gpa,outcome,subjects
```

Example:

```csv
roll,registration,studentName,gpa,outcome,subjects
1001,1234567890,শিক্ষার্থীর নাম,4.50,pass,বাংলা:80|ইংরেজি:75|গণিত:70
1002,1234567891,অন্য শিক্ষার্থী,,fail,বাংলা:35|ইংরেজি:40
```

- `subjects` is `subject:marks` separated by `|`.
- Marks must be 0–100; GPA must be 0–5 or blank.
- `outcome`: `pass`, `fail`, `withheld` or `absent`.
- Duplicate roll or registration within the file or the selected examination is reported.
- Results are labelled unofficial on the public result page. Never describe a web printout as the official transcript.

## Documents

- Accepted types: PDF, JPEG, PNG, text, DOC/DOCX, XLS/XLSX.
- Maximum size: 8 MB.
- Upload as draft, review, then publish.
- Downloads go through the API, not a public folder.
- Archive old documents instead of leaving outdated versions published.
- Do not upload files containing personal data without a lawful basis and an access policy.

## Backups and recovery

- **সাইট সেটিংস → ডেটা ব্যাকআপ** creates a manual backup and lists recent backups.
- Automatic backups are created before result overwrite, record deletion, message deletion and demo-content removal.
- The app keeps the last 25 JSON backups. Copy them off-server regularly.
- File uploads live outside `db.json`; back up the uploads folder too.
- Test a restore on a copy before relying on it. See [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Accounts and audit

- The server refuses to remove the last active administrator.
- Administrators cannot change their own role or deactivate themselves.
- Password changes revoke other sessions.
- Deactivating a user revokes their sessions.
- The audit log is read-only. It records sign-ins, content changes, result actions, user changes, settings and backups.
- Audit entries can contain personal data. Share exports only with authorised people.

## When information is missing

Use the pending wording and ask the college authority for an official source. Update **সাইট সেটিংস** once confirmed. See [`OFFICIAL-INFORMATION.md`](OFFICIAL-INFORMATION.md).

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Login says credentials are wrong | Caps Lock, exact e-mail, account active, password reset. |
| “অনেক বেশি অনুরোধ” | Rate limit; wait for the window to reset. Restarting the server clears local limits. |
| Result not found | Examination and result published? Roll/registration exact? Session/programme filters correct? |
| Cannot publish a result | Publish the examination first. |
| Import reports duplicates | Confirm roll/registration; choose skip or deliberate overwrite. |
| Upload rejected | File type or 8 MB limit. |
| Changes disappeared after deploy | Data directory was not persistent, or multiple processes wrote the JSON store. Restore the latest backup and fix `DATA_DIR`. |
