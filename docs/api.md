# API CONTRACT (FRONTEND REFERENCE)

This file is the **ONLY source of truth** for API usage.

## 🚫 STRICT RULES (VERY IMPORTANT)

* DO NOT invent endpoints
* DO NOT assume fields not listed here
* DO NOT change request/response structure
* If data is missing → SKIP feature (do not guess)

---

# BASE URL

```
/api
```

---

# AUTH

## POST /auth/register

Body:

```
{
  name: string,
  email: string,
  password: string,
  phone_number: string
}
```

Response:

```
{
  message: string,
  data: {
    user: {
      id: number,
      name: string,
      email: string,
      role: string
    },
    token: string
  }
}
```

---

## POST /auth/login

Body:

```
{
  email: string,
  password: string
}
```

Response:

```
{
  message: string,
  data: {
    user: {
      id: number,
      name: string,
      email: string,
      role: string
    },
    token: string
  }
}
```

---

## GET /auth/session

Headers:

```
Authorization: Bearer <token>
```

Response:

```
{
  message: string,
  data: {
    user: {
      id: number,
      name: string,
      email: string,
      role: string
    }
  }
}
```

---

# BATCH

## GET /batch

Query params:

```
page
limit
q (keyword)
type (LIVE | COURSE)
tag
tagMode (and | or)
status (OPEN | ONGOING | FULL)
is_full (true | false)
orderBy (created_at | title | price | start_date | remaining_quota)
orderDir (asc | desc)
```

Response:

```
{
  data: Batch[],
  meta: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  },
  summary: {
    open: number,
    ongoing: number,
    full: number,
    active: number
  }
}
```

---

## Batch Object

```
{
  id: number,
  title: string,
  description: string | null,
  image_url: string | null,
  type: "LIVE" | "COURSE",
  start_date: string | null,
  end_date: string | null,
  price: number,
  quota: number | null,

  status: "ACTIVE" | "CLOSED",
  status_effective: "OPEN" | "ONGOING" | "FULL",

  enrolled_count: number,
  remaining_quota: number | null,
  is_full: boolean,

  tags: string[]
}
```

---

## GET /batch/:id

Response:

```
{
  data: BatchDetail
}
```

BatchDetail tambahan:

```
{
  mentors: {
    id: number,
    name: string,
    bio: string
  }[]
}
```

---

## POST /batch (ADMIN)

Body:

```
{
  title: string,
  description?: string,
  image_url?: string,
  type?: "LIVE" | "COURSE",
  start_date?: string,
  end_date?: string,
  quota?: number,
  price: number,
  tags?: string[],
  mentors?: number[],
  status?: "ACTIVE" | "CLOSED"
}
```

---

## PUT /batch/:id (ADMIN)

Body:

```
{
  title?: string,
  description?: string,
  image_url?: string,
  type?: "LIVE" | "COURSE",
  start_date?: string,
  end_date?: string,
  price?: number,
  quota?: number,
  tags?: string[],
  mentors?: number[],
  status?: "ACTIVE" | "CLOSED"
}
```

---

## MENTOR (BATCH)

### POST /batch/:id/mentor

Body:

```
{
  mentor_id: number
}
```

---

### DELETE /batch/:batchId/mentor/:mentorId

---

# ENROLLMENT

## GET /enrollment (ADMIN)

Query:

```
page
limit
q
batchId
status (PAID | PENDING | EXPIRED | ACTIVE)
is_expired (true | false)
paid_only (true | false)
```

Response:

```
{
  data: Enrollment[],
  meta: {
    page,
    total,
    totalPages
  },
  summary: {
    total,
    paid,
    pending,
    pending_active,
    pending_expired
  }
}
```

---

## Enrollment Object

```
{
  enrollment_id: number,
  payment_status: "PAID" | "PENDING",
  expires_at: string | null,
  enrolled_at: string,

  user: {
    id: number,
    name: string,
    email: string
  },

  batch: {
    id: number,
    title: string
  }
}
```

---

## POST /enrollment

Body:

```
{
  batch_id: number
}
```

---

## GET /enrollment/my-enrollment

Response:

```
{
  data: Enrollment[]
}
```

---

## GET /enrollment/my-payment

Query:

```
page
limit
q
status (PAID | PENDING | EXPIRED)
```

---

## GET /enrollment/:id/invoice

Response:

```
{
  invoice_number: string,
  issued_at: string,
  status: string,
  customer: {
    name,
    email
  },
  batch: {
    title,
    price
  },
  total: number
}
```

---

# USER

## GET /user/me

Response:

```
{
  data: {
    id: number,
    email: string,
    role: "USER" | "ADMIN" | "MENTOR"
  }
}
```

---

## GET /user (ADMIN)

Query:

```
page
limit
q (email search)
role (USER | ADMIN | MENTOR)
status (ACTIVE | SUSPENDED | BANNED)
orderBy (created_at | email)
orderDir (asc | desc)
```

Response:

```
{
  data: User[],
  meta: {...},
  summary: {
    ACTIVE,
    SUSPENDED,
    BANNED,
    total
  }
}
```

---

## PATCH /user/:id/role (ADMIN)

Body:

```
{
  role: "USER" | "ADMIN" | "MENTOR"
}
```

---

## PATCH /user/:id/suspend

## PATCH /user/:id/ban

## DELETE /user/:id

(No body required)

---

# MENTOR

## GET /mentor

Query:

```
page
limit
q (name search)
orderBy (created_at | name)
orderDir (asc | desc)
mode (list | summary)
```

Response:

```
{
  data: Mentor[],
  meta: {...}
}
```

---

## GET /mentor/:id

Response:

```
{
  data: {
    id,
    name,
    bio,
    linkedin,
    github,
    website,
    user: { id, email },
    batches: [{ id, title }]
  }
}
```

---

## POST /mentor (ADMIN)

Body:

```
{
  user_id: number,
  name: string,
  bio: string,
  linkedin?: string,
  github?: string,
  website?: string
}
```

---

## PATCH /mentor/:id (ADMIN)

Body:

```
{
  name,
  bio,
  linkedin?,
  github?,
  website?
}
```

---

# MATERIAL

## GET /material/batch/:batchId

Response:

```
{
  data: Material[]
}
```

---

## GET /material/:id

Response:

```
{
  data: Material
}
```

---

## POST /material (ADMIN)

Body:

```
{
  title: string,
  content: string,
  batch_id: number,
  order: number,
  video_url?: string
}
```

---

## PUT /material/:id (ADMIN)

Body:

```
{
  title?,
  content?,
  order?,
  video_url?
}
```

---

## DELETE /material/:id (ADMIN)

---

## POST /material/:id/progress

Response:

```
{
  message: string,
  data: {
    completed: true
  }
}
```

---

## GET /material/batch/:batchId/progress

Response:

```
{
  data: Progress[]
}
```

---

## GET /material/batch/:batchId/progress-summary

Response:

```
{
  data: {
    total_materials,
    completed,
    progress_percent
  }
}
```

---

# PAYMENT

## POST /payment/midtrans/callback

⚠️ INTERNAL ONLY
DO NOT USE IN FRONTEND

---

# IMPORTANT NOTES

## 1. ROLE-BASED ACCESS

* USER → limited access
* ADMIN → full access
* MENTOR → batch-related access

---

## 2. COMPUTED FIELDS (IMPORTANT FOR UI)

Batch includes:

```
status_effective
remaining_quota
is_full
```

👉 ALWAYS use these (DO NOT compute manually in frontend)

---

## 3. ERROR HANDLING

Errors are thrown with:

```
{
  message: string,
  status: number
}
```

---

## 4. DO NOT GUESS

If API does not provide:

* field
* endpoint
* relation

👉 DO NOT IMPLEMENT FEATURE

---

## 5. FRONTEND BEST PRACTICE

* Always use query params instead of client filtering
* Use summary data instead of computing manually
* Respect pagination

```
---

```
