# Backend for Roomie app

> An app helps roommates in one apartment manage housework

You can test the software via [the Heroku URL](https://roomie-app-backend.herokuapp.com/)

Credentials: username: `anhtumai`, password: `anhtumaipassword`

## Documentation

ERD digram: [ERD digram link](https://drive.google.com/file/d/13wO82H7EFu7UNHLWs4OFDugKqwMUVbo1/view?usp=sharing)

API documentation with Postman: [Docs link](https://documenter.getpostman.com/view/4337348/UUxwCov3)

## Functionality

An app provides REST API endpoints to enable members in one apartment
to create and assign housework to each other.

- Users can create, delete and edit an apartment with "/api/apartments" endpoints

- Users can invite other people to their apartment with POST "/api/invitations".
Users can also accept, reject and cancel an invitation.

- Users can view their information and apartment information with "/api/me" and "/api/me/apartment"
- Users can create, delete and edit tasks with "/api/tasks" endpoints

- After creation, a task will only be a task request.
It has 3 states: "accepted", "pending" and "rejected".
All assigners have to accept the task, in order for it to become a task assignment.

- A task assignment contains task information and order of assigners,
  specifying which week a person needs to do that task.

- Creator or apartment admin can change the order, assigners and the properties
with PUT "/api/tasks/:id/order", "/api/tasks/:id/assigners", "/api/tasks/:id" endpoints.
