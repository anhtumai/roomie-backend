# API v2

**GET** `/api/me`

Get the profile of current user

Input:

- Authorization is needed

Return:

```json
{
  "id": 1,
  "name": "Anh Tu Mai",
  "username": "anhtumai",
  "apartment": {
    "id": 1,
    "name": "HOAS Klanneettie"
  }
}
```

**GET** `/api/me/apartment` && `/api/apartments/:id`

Get the apartment of current user

Input:

- Authorization is needed

Return:

```json
{
  "id": 1,
  "name": "HOAS Klanneettie",
  "admin": {
    "id": 1,
    "username": "anhtumai",
    "name": "Anh Tu Mai"
  },
  "members": [
    {
      "id": 1,
      "username": "anhtumai",
      "name": "Anh Tu Mai"
    },
    {
      "id": 2,
      "username": "pexea",
      "name": "Dung Pham"
    }
  ],
  "tasks": {
    "assignments": [
      {
        "id": 1,
        "type": "assignment",
        "name": "clean the kitchen",
        "description": "clean the floor and also the kitchen sink",
        "frequency": 1,
        "difficulty": 5,
        "createdBy": {
          "id": 1
        },
        "assignersOrder": [
          {
            "id": 1
          },
          {
            "id": 2
          }
        ]
      }
    ],
    "requests": [
      {
        "id": 2,
        "type": "request",
        "name": "clean the balcony",
        "description": "bla bla bla ...",
        "frequency": 1,
        "difficulty": 5,
        "createdBy": {
          "id": 1
        },
        "pendingBy": [
          {
            "id": 1
          }
        ],
        "rejectedBy": [
          {
            "id": 2
          }
        ]
      }
    ]
  }
}
```

**POST** `/api/apartments`

Create new apartment

Input:

- Authorization is required

Returns

```json
{
  "id": 1,
  "name": "HOAS Klanneetitie",
  "admin": {
    "id": 1,
    "username": "anhtumai",
    "name": "Anh Tu Mai"
  }
}
```

**PUT** `/api/apartments/:id`

Edit name / admin of an apartment

**DELETE** `/api/apartments/:id`

Delete an apartment

**GET** `/api/me/invitations`

Get all invitations related to the account

Input:

- Authorization is required

Return:

```json
{
  "invitations": {
    "sent": [
      {
        "id": 1,
        "invitor": {
          "id": 1,
          "username": "anhtumai",
          "name": "Anh Tu Mai"
        },
        "invitee": {
          "id": 2,
          "username": "pexea",
          "name": "Dung Nguyen Thien"
        },
        "apartment": {
          "id": 1,
          "name": "HOAS Klanneetitie",
          "adminId": 1
        }
      }
    ],
    "received": []
  }
}
```

**GET** `/api/me/invitations/sent`

Get all your sent invitations

**GET** `/api/me/invitations/received`

Get all your received invitations

**POST** `/api/invitations`

Create a new invitation

Input:

- Authorization is required
- `username={{ inviteeUsername }}`

```json
{
  "id": 1,
  "invitor": {
    "id": 1,
    "username": "anhtumai",
    "name": "Anh Tu Mai"
  },
  "invitee": {
    "id": 2,
    "username": "pexea",
    "name": "Dung Nguyen Thien"
  },
  "apartment": {
    "id": 1,
    "name": "HOAS Klanneetitie"
  }
}
```

**GET** `/api/invitations/:id`

Get the details of invitation

Input:

- Authorization is required

```json
{
  "id": 1,
  "invitor": {
    "id": 1,
    "username": "anhtumai",
    "name": "Anh Tu Mai"
  },
  "invitee": {
    "id": 2,
    "username": "pexea",
    "name": "Dung Nguyen Thien"
  },
  "apartment": {
    "id": 1,
    "name": "HOAS Klanneetitie"
  }
}
```

**POST** `/api/invitations/:id/reject`

Reject the invitation

Input:

- Authorization is required

Return:

```json
{
  "msg": "Reject invitation to HOAS Klanneetitie by anhtumai"
}
```

**POST** `/api/invitations/:id/accept`

Accept the invitation

Input:

- Authorization is required

Return:

```json
{
  "msg": "Accept invitation to HOAS Klanneetitie by anhtumai"
}
```

**DELETE** `/api/invitations/:id`

Delete your own invitations

Input:

- Authorization is required

Return: code 204 no content

**GET** `/api/me/apartment/tasks` && `/api/apartments/:id/tasks`

Get all tasks, including requests and assignments in your apartment

Input:

- Authorization is required

Return:

```json
{
  "tasks": {
    "assignments": [
      {
        "id": 1,
        "type": "assignment",
        "name": "clean the kitchen",
        "description": "clean the floor and also the kitchen sink",
        "frequency": 1,
        "difficulty": 5,
        "createdBy": {
          "id": 1
        },
        "assignersOrder": [
          {
            "id": 1,
            "username": "anhtumai",
            "name": "Anh Tu Mai"
          },
          {
            "id": 2,
            "username": "pexea",
            "name": "..."
          }
        ]
      }
    ],
    "requests": [
      {
        "id": 2,
        "type": "request",
        "name": "clean the balcony",
        "description": "bla bla bla ...",
        "frequency": 1,
        "difficulty": 5,
        "createdBy": {
          "id": 1
        },
        "acceptedBy": [],
        "pendingBy": [
          {
            "id": 1,
            "username": "...",
            "name": "..."
          }
        ],
        "rejectedBy": [
          {
            "id": 2,
            "username": "...",
            "name": "..."
          }
        ]
      }
    ]
  }
}
```

**GET** `/api/tasks/:id`

Get detail of a task

Input:

- Authorization is required

Return:

```json
{
  "id": 1,
  "type": "assignment"
  //...
}
```

**POST** `/api/tasks`

Create new task in your apartment and also new tast request

**PUT** `/api/tasks/:id`

Edit task. After editting, task will be converted to "request" with "pending"
states from all sides.
All assigners need to accept the task request again.

**GET** `/api/me/tasks/requests`

Get all task requests in your apartment

**GET** `/api/me/tasks/assignments`

Get all task assignments in your apartment
