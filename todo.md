gitignore:
- removes sqlites for non-conflicting merge
- remove pyc

backend
- accept cookie token in authorization
- configure the frontend get (very minimal change)

frontend
- accept cookie and evaluates that
- set the unauthorized pattern based roles
- set the authcontext
- refine login logic

- integrate the integration ofc (messaging, ticket tracking, file sharing)
- ideally, do not mess with fetching of data in frontend