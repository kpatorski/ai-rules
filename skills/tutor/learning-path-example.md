# Learning path: Basics of Argo CD

Here goes the record of the learning plan for a topic. The plan should contain a list of topics that need to be
mastered, and a list of exercises/knowledge checks. It's like an index for learning. Fairly general, since the details
of each topic will be in separate sections (##Topics). Based on the plan, a stack (##Stack) is generated, which
determines the learning order.

## Stack

The most dynamic element of the learning-path.md file. This section holds a list of all topics (table) that are part of
the learning path. Each topic is represented as an object with the fields: `id`, `title`, `summary`, `url`
and `prerequisites` (links to topics that must be mastered before starting this topic):

- `id`: The topic's id, e.g. "fdf4fc3" - a unique identifier for the topic, similar to a shortened git commit hash,
  which can be generated e.g. using a UUID generator tool.
- `title`: The topic's title, e.g. "Introduction to Argo CD".
- `summary`: A short description of the topic, e.g. "In this topic you'll learn what Argo CD is and what problems it
  solves."
- `url`: A link to the section in this file (learning-path.md) that contains detailed information about the topic.
- `prerequisites`: A list of links to topics (ids) that must be mastered before starting this topic. Can be empty if
  there are no prerequisites.

The stack is created based on the creation of the learning plan. Once created, the stack is continuously updated and
adjusted to the progress of learning.

The table works like a stack (as in Java):

- at the very top is the topic that should be mastered first, or the topic currently being worked on,
- below it is the next topic in order to be mastered, and so on, down to the topic that is last in the order,
- for topics that have the same learning priority, the topic is placed in alphabetical order by topic id,
- once a topic has been completed, it should be removed from the stack (moving the entry to the table of completed
  topics), and the next topic in order becomes the current topic to learn,
- an entry from the table of completed topics can return to the stack if needed, e.g. if during learning it turns out
  the material was not understood at all and needs to be revisited.

### 📋 Stack table

| Id      | Title                           | Summary                                                                     | URL                                                                                    | Prerequisites          |
|---------|---------------------------------|----------------------------------------------------------------------------|--------------------------------------------------------------------------------------|-------------------------|
| fdf4fc3 | Introduction to Argo CD         | In this topic you'll learn what Argo CD is and what problems it solves     | [fdf4fc3 - Introduction to Argo CD](#fdf4fc3---introduction-to-argo-cd)              |                         |
| 3ec432a | What is a Docker container      | Basic information about Docker and its container                          | [3ec432a - What is a Docker container](#3ec432a---what-is-a-docker-container)        |                         |
| 7ec473b | Basic Kubernetes building blocks | Overview of the building blocks that make up Kubernetes                   | [7ec473b - Basic Kubernetes building blocks](#7ec473b---basic-kubernetes-building-blocks) |                     |
| baf6bd7 | Knowledge check                 | Summary of the material and a check of the user's knowledge (10-question format) | [baf6bd7 - Knowledge check](#baf6bd7---knowledge-check)                        | fdf4fc3, 3ec432a, 7ec473b |
| 6e59255 | Canary Deployment in Argo CD    | What Canary Deployment is in Argo CD                                      | [6e59255 - Canary Deployment in Argo CD](#6e59255---canary-deployment-in-argo-cd)   | baf6bd7                 |
| ...     | ...                             | ...                                                                        | ...                                                                                  | ...                     |

### ✅ Table of completed topics

| Id      | Title                  | Summary        | URL                                                             | Prerequisites |
|---------|------------------------|----------------|---------------------------------------------------------------|----------------|
| 6e9196b | Introduction to Docker | What Docker is | [6e9196b - Introduction to Docker](#6e9196b---introduction-to-docker) |            |
| f8ab4bb | Introduction to CI/CD  | What CI/CD is  | [f8ab4bb - Introduction to CI/CD](#f8ab4bb---introduction-to-cicd)   |            |
|         |                        |                |                                                             |                |

---

## Topics

// Each topic should have its own section in this file, with a unique heading (topic id) and description. 
// The topic's section should contain detailed information about the topic, including links to learning resources, examples, exercises and other educational materials. 
// Each topic should be described in a way that is understandable to someone who is just starting to learn the given subject. 
// It is essentially a notebook for a particular topic, which can be filled in during learning. 
// Images attached to the file should be named according to the topic id, e.g.: `6e9196b-architecture-overview.png`, so they can easily be associated with the given topic.

### 6e9196b - Introduction to Docker

Notes for 6e9196b go here

---

### f8ab4bb - Introduction to CI/CD

Notes for f8ab4bb go here

---

### fdf4fc3 - Introduction to Argo CD

### 7ec473b - Basic Kubernetes building blocks

### 3ec432a - What is a Docker container

### baf6bd7 - Knowledge check

### 6e59255 - Canary Deployment in Argo CD
