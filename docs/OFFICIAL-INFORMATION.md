# Official information checklist

This file separates what the website currently states from what still requires an official source. The site is deliberately conservative: unverified items are marked **তথ্য হালনাগাদ করা হচ্ছে / Verification pending** rather than guessed.

## Source of the current baseline

The following were supplied in the project brief used to build the site. They still need confirmation against college records before being treated as a final official publication.

| Item | Current value | Site treatment |
| --- | --- | --- |
| Bangla name | কোলা আদর্শ ডিগ্রি কলেজ | Published |
| English name | Kola Adarsha Degree College | Published |
| EIIN | 123139 | Published |
| Location | কোলা, বাদলগাছী, নওগাঁ, রাজশাহী বিভাগ, বাংলাদেশ | Published |

## Verification checklist

Mark an item **Confirmed** only when the college provides a citable official document, notice, signboard, letterhead, or authorised representative confirmation. Record the source and date in the change log.

### Institution profile

| Item | Current state | Status | Where to update |
| --- | --- | --- | --- |
| Exact establishment date | History text says “২১ জানুয়ারি ১৯৯৫” as *received information*, but `establishedVerified` is false | **Pending** — do not present as confirmed | Site settings → Institution → establishment date + verified flag |
| Institution type | “Higher-secondary and degree-level institution (verification pending)” | **Pending** | Site settings → Institution |
| Education levels | HSC and Degree (Pass) listed with caveat | **Pending** | Site settings → Institution |
| Groups/streams | Science, Humanities, Business Studies listed with caveat | **Pending** | Site settings → Institution |
| Affiliation / board / university | “যাচাই প্রক্রিয়াধীন” | **Pending** | Site settings → Institution |
| Recognition / MPO / approval status | “যাচাই প্রক্রিয়াধীন” | **Pending** | Site settings → Institution |
| EIIN confirmation | 123139 from brief | **Confirm** | Site settings → Institution |
| Official phone | Empty | **Pending** | Site settings → Institution |
| Official e-mail | Empty | **Pending** | Site settings → Institution |
| Official website / social media | Empty | **Pending** | Site settings → Institution |
| Office hours | Empty | **Pending** | Site settings → Institution |
| Postal code | Empty | **Pending** | Site settings → Institution |
| Map location | Not embedded; placeholder | **Pending** | Site settings → Institution (`mapVerified`) |
| Mission statement | Approval-pending copy | **Pending approval** | Site settings → Content |
| Vision statement | Approval-pending copy | **Pending approval** | Site settings → Content |
| Principal name, designation, message, photo | Empty / approval-pending copy | **Pending** | Site settings → Content |
| History and milestones | Cautious summary with pending wording | **Pending** | Site settings → Content |
| Facilities | Generic names only; detail says “তথ্য হালনাগাদ করা হচ্ছে” | **Pending** | Site settings → Content → Facilities |
| Achievements | None published | **Pending** | Site settings → Content → Achievements |
| Campus photographs | None | **Pending** | Content/assets process needed |

### People

| Item | Current state | Status | Where to update |
| --- | --- | --- | --- |
| Teacher roster | **No teacher records seeded** | **Pending official list** | Dashboard → Teachers |
| Principal / vice-principal records | None | **Pending** | Dashboard → Teachers |
| Administrative/support staff | None | **Pending** | Dashboard → Teachers |
| Student records | **No student records seeded** | **Pending official data** | Dashboard → Students |
| Teacher photos | No photo field in the current local model | **Not implemented** | Needs schema/UI work before publishing photos |

### Academic information

| Item | Current state | Status | Where to update |
| --- | --- | --- | --- |
| Academic sessions | Two sessions seeded as structural defaults (২০২৫–২০২৬, ২০২৬–২০২৭) | **Confirm** | Dashboard → Academics → Sessions |
| Programmes | HSC and Degree (Pass) with `verified: false` | **Pending** | Dashboard → Academics → Programmes |
| Subjects | Generic subject list with codes, not an official curriculum | **Pending** | Dashboard → Academics → Subjects |
| Class routines | None | **Pending** | Dashboard → Academics → Routines |
| Examination schedule | None | **Pending** | Dashboard → Academics → Examinations |
| Academic calendar | Two **নমুনা** provisional entries | **Sample only** | Dashboard → Academics → Calendar |
| Results | None | **Pending verified results** | Dashboard → Results |

### Notices, events and admission

| Item | Current state | Status | Where to update |
| --- | --- | --- | --- |
| Notices | Three **নমুনা** notices, clearly badged | **Sample only** | Dashboard → Notices |
| Events | Two **নমুনা** events, clearly badged | **Sample only** | Dashboard → Events |
| Admission process | Verification-pending copy | **Pending official notice** | Site settings → Admission |
| Eligibility | Verification-pending copy | **Pending official notice** | Site settings → Admission |
| Required documents | Verification-pending copy | **Pending official notice** | Site settings → Admission |
| Fees | Verification-pending copy | **Pending official notice** | Site settings → Admission |
| Deadline | Empty | **Pending official notice** | Site settings → Admission |
| Application URL | Empty | **Pending official channel** | Site settings → Admission |
| Admission FAQ | Generic guidance only | **Review** | Site settings → Admission → FAQs |

### Documents and announcements

| Item | Current state | Status |
| --- | --- | --- |
| Official PDFs/forms | None uploaded | **Pending** |
| Syllabus/curriculum documents | None | **Pending** |
| Annual report | None | **Pending** |
| Result sheets | None | **Pending verified data** |
| Privacy/terms legal review | Draft website copy | **Needs college/legal approval** |

## Things the website does not claim

Do **not** infer or add any of the following without an official source:

- pass rates, GPA averages, ranking or “best college” claims;
- number of students or teachers;
- affiliation, recognition, MPO status or university attachment;
- principal name or message;
- official phone, e-mail, website or Facebook page;
- admission fees, deadlines, quotas or application links;
- exact founding date or founder names;
- facilities that have not been confirmed;
- any result, mark, roll or registration number for a real student.

## Verification workflow

1. Obtain a source document or authorised confirmation.
2. Record: item, value, source, date verified, person who verified.
3. Update the relevant settings/record in the dashboard.
4. Set the matching `verified` flag only when the source is on file.
5. Remove demo badges by deleting/replacing the sample records.
6. Re-check the public page and its English/Bangla wording.
7. Keep the source record with the college office; the website is not the source of truth.

## English/Bangla consistency

Every public content item has Bangla and English fields. When updating official facts, update **both** languages. If an English translation is not approved yet, use the pending wording in English rather than leaving a misleading translation.

## Contact for corrections

The current contact form stores messages for administrators. Until an official phone/e-mail is verified, do not publish invented contact details. Add the verified channel in Site settings and on the Contact page.
