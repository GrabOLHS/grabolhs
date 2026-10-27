Grab OLHS static website
========================

Folder layout:
  index.html, style.css, script.js        Home/about page
  courses/index.html, courses/style.css, courses/script.js
  assets/course_database.csv              Course data
  assets/grabolhsicon.jpg                 Placeholder favicon

Before publishing:
1. Replace assets/course_database.csv with your complete course_database.csv.
   The included CSV contains only the five sample rows from the request.
2. In both HTML files, replace YOUR-CODE in the GoatCounter script URL with
   your GoatCounter site code (for example, yoursite.goatcounter.com).
3. Commit/push the contents of this folder to your GitHub Pages repository.
   The course page fetches ../assets/course_database.csv, so use a local web
   server for testing; opening the HTML directly as file:// will block fetch.
4. If you already have your own assets/grabolhsicon.jpg, replace the placeholder.

The email form uses mailto: and opens the visitor's default email app; it does
not send email directly from the website.
