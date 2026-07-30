# User manual screenshots

Drop screenshot images into this folder. The manual at `/user-manual` picks them up
automatically — no code change and no rebuild needed. Any file that is missing shows a
labelled dashed placeholder instead of a broken image, so the page always renders.

## Rules

- Use the **exact** file names below (PNG, lowercase).
- Capture the desktop app at a browser width of 1440–1600 px, zoom 100%.
- Capture the mobile figures (26–30) at a phone width of about 390 px.
- Keep each file under ~500 KB.
- **Mask real employee names, mobile numbers, NID and licence data** — `/user-manual` is a
  public page.
- After replacing a file, hard-refresh the page (`Ctrl`+`F5`) to bypass the browser cache.

## File names

| Fig. | File | Capture |
| ---: | --- | --- |
| 1 | `01-login.png` | Sign-in screen |
| 2 | `02-dashboard.png` | Dashboard with KPI tiles and charts |
| 3 | `03-vehicle-master.png` | Vehicle Master list |
| 4 | `04-vehicle-add-dialog.png` | Add Vehicle dialog |
| 5 | `05-driver-master.png` | Driver Master list |
| 6 | `06-driver-add-dialog.png` | Add Driver dialog |
| 7 | `07-vehicle-categories.png` | Vehicle Categories list |
| 8 | `08-fuel-types.png` | Fuel Types list |
| 9 | `09-rate-card.png` | Rate Card Configuration |
| 10 | `10-requisitions-list.png` | Trip Requisitions list |
| 11 | `11-requisition-new.png` | New Requisition form with map |
| 12 | `12-requisition-assign.png` | Assign Vehicle & Driver dialog |
| 13 | `13-requisition-extend-time.png` | Extend Trip Time dialog |
| 14 | `14-requisition-details.png` | Requisition Details with route |
| 15 | `15-trip-invoice.png` | Trip Invoice preview |
| 16 | `16-billing-list.png` | Billing & Invoices list |
| 17 | `17-invoice-detail.png` | Invoice detail / charge breakdown |
| 18 | `18-invoice-adjustment.png` | Manual Billing Adjustment dialog |
| 19 | `19-reports-hub.png` | Reports hub |
| 20 | `20-report-vehicle-billing.png` | Vehicle Billing Report with filters |
| 21 | `21-report-excel-export.png` | Exported Excel sheet |
| 22 | `22-audit-log.png` | Audit Log |
| 23 | `23-integration-logs.png` | Integration Logs |
| 24 | `24-users.png` | Users list |
| 25 | `25-roles.png` | Roles and permission matrix |
| 26 | `26-mobile-login.png` | Mobile sign-in |
| 27 | `27-mobile-home.png` | Mobile home counters |
| 28 | `28-mobile-trips.png` | Mobile trip list |
| 29 | `29-mobile-trip-details.png` | Mobile trip details |
| 30 | `30-mobile-profile.png` | Mobile profile |

## Adding a new figure

Copy an existing `<figure class="shot">` block in `../index.html` and change the file name
in all three places: `data-file`, the `<img src>`, and the caption.
