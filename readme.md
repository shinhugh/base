# Microservices foundation

This project serves as a foundation to build on top of when developing a
microservice-oriented HTTP API. Two services are provided:

- Account service
- Profile service

The account service provides the following functionalities:

- Account creation
- Login
- ID token refresh
- Logout with proper token revocation
- Account read, update, and delete (with access control)
- Granular access control over resources and other APIs

The profile service, as is, only provides users the ability to create a
public-facing name; it is intended to be extended upon as needed by the
application. It is essentially a placeholder and an example member of the
microservice network. It can safely be discarded altogether without affecting
the core account and authentication system.

As application-specific services are introduced into this ecosystem, they can
work with the information provided by the account service. There is no need for
the developer to manage credentials, tokens, sessions, and such; the account
service entirely encapsulates these details.

## Overview

![Architecture](docs/architecture.png)

Upon an HTTP request arriving at the gateway, the gateway unconditionally
forwards it to the account service. The service constructs an authority object,
which contains information relevant to what actions the client is allowed to
execute. If the request does not contain a valid ID token, an empty authority
object is generated.

The account service sends this authority object back to the gateway, which then
forwards it to the request's original destination alongside the request itself.
The receiving service can then use this generated information to determine
whether the client is authorized to perform the actions detailed by the request.

There are diagrams in the **Flows** section that describe the flows in greater
detail.

## The authority model

An "authority", in the internal context of this architecture, is a chunk of
information that gets sent alongside every request to every service. It is used
by the service to determine whether the request should be accepted or denied. It
is comprised of the following information:

- **The identity of the caller**: This is the ID (UUID) of the account that the
account service has correlated with the client. This would, for example, be used
by the service to allow reading of private data that is restricted to the owner
user only.
- **The roles of the caller**: This is a bit-flag represented in plain decimal
form. Each bit represents a different role; a 1 signifies that the caller
possesses the role. Starting from the least significant bit (right to left), the
current roles are as following: system (1 / `001`), user (2 / `010`), and admin
(4 / `100`). Thus, a client that is both a user and an administrator would have
6 (`110`) as their role, whereas the system itself would operate with a 1
(`001`). More roles can be added as the application grows; the existing roles
take up the least significant bits, so the addition of new roles does not affect
the existing entries.
- **The time that the authentication was confirmed**: This is the point in time
that the user provided their credentials to verify their identity and generate
the ID token that is currently being used. This is used by certain services to
allow access to more privileged actions. For example, the account service
restricts account modification and termination to sessions that are no older
than 15 minutes; if it has been over 15 minutes since the login event, the
session may still be valid, but the account service will deny requests for
account modification and termination. This protects the user from scenarios
where a third party gains physical access to the user's device and tries to
modify the user's password.

Each service manages a different aspect of the application's domain, so each
will have different rules and requirements that dictate what gets allowed and
what gets denied. The authority construct is what supplies the service with the
information it needs to make this decision.

## Physical configuration

It is extremely crucial that none of the services are directly accessible from
the public. The gateway should be the one and only node that is reachable by the
client. This is because each service operates with the assumption that every
incoming request has first been handled by the gateway and, as a result,
contains authority claims that can be trusted. If a service were to be directly
exposed to the public without the gateway's interference, any client could forge
a request with false authority claims and execute actions that would otherwise
be unauthorized.

Note that this can take many different forms, depending on how the services are
deployed:

- The most typical and straightforward setup would be to have each service
running on a dedicated machine. In this case, the machines would be operating
within the same private network, not accessible from outside the network. The
gateway would be the entry point that all clients interface with. For this
setup, the private network must be secured such that the services are not
directly reachable.
![Private network configuration](docs/private-network-configuration.png)

- For scenarios that expect lighter traffic and workloads, all services can run
on a single machine (as separate processes using different ports). This allows
the scope to be reduced, where the aforementioned "private network" becomes
`localhost` (internal communication within the same machine). This eliminates
the need for a dedicated private network; the system can define its trust
boundaries within the single machine. For this setup, the machine's firewall
must be configured to deny all requests headed for the services' ports while
allowing requests for the gateway's port.
![Single machine configuration](docs/single-machine-configuration.png)

Simply put, each service is ultimately a single process (or possibly a group of
processes, depending on how the service is built). Where these processes are
deployed is not important and can vary between applications. The key takeaways
are:

- Each service must be protected from direct requests from the public.
- Inter-service communication, as well as traffic between the gateway and
services, should be allowed and hidden from the public.
- The gateway should be exposed to the public.

## Internal communication

"Internal" communication refers to service-service and gateway-service
communication. None of this traffic should be visible to the public. Note that
there will likely be other headers involved than the ones listed (e.g.
user-agent), but only the relevant ones are shown. Additionally, the listed
values should be replaced with the appropriate values.

### Initial identification

The identification request is the very first piece of internal communication
that occurs when a client's request arrives at the gateway. The gateway extracts
the ID token from the authorization header of the client's request and sends a
request with the following format to the account service:

```
GET /identify
host: localhost:8000
content-type: application/json
content-length: 198

"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJiYzVkM2MyMi1mODNhLTRhNjctOTExMS1mZDhiZWJlMjRkYzUiLCJpYXQiOjE2ODExNDA4MTAsImV4cCI6MTY4MTIyNzIxMH0.P-V0W3HwrUMT7NotqxoWFgKIxbPAtAU8mPHnxQOCZPA"
```

The account service responds in the following format:

```
200
content-type: application/json
content-length: 77

{"id":"00000000-0000-0000-0000-000000000000","roles":6,"authTime":1681140810}
```

In the case that the client has provided an invalid ID token, the authentication
service responds with the following:

```
200
content-type: application/json
content-length: 2

{}
```

### Request forwarding

Once the gateway has acquired the identity information from the authentication
service, the gateway modifies the original request by adding custom headers as
such:

```
authority-id: 00000000-0000-0000-0000-000000000000
authority-roles: 6
authority-auth-time: 1681140810
```

This request, with the modified headers, is then sent to the destination
service.

In the case that the account service provides no identification information
(i.e. the client sent an invalid ID token), the client's request is sent in its
original unmodified state.

### Inter-service requests

There are many scenarios where a service may invoke another service. In such a
scenario, the calling service must provide the original authority information
crafted by the gateway. This allows the called service to determine whether the
client is authorized to execute the action.

This is very similar to the concept of subroutines in a normal software stack,
where a piece of code invokes a function or method. The subroutine, although
invoked by the parent code, should still be treated as if it was called by the
top-most invocation. A simple diagram explains the concept:

```
a() -> b() -> c()
```

`a()` invokes `b()`, which in turn invokes `c()`. Despite `b()` being the
immediate parent of `c()` in the calling chain, `c()` needs to consider the
authority of `a()`.

The format for this is identical to the requests forwarded from the gateway:

```
authority-id: 00000000-0000-0000-0000-000000000000
authority-roles: 6
authority-auth-time: 1681140810
```

### System override

In some special cases, nested service calls may be done with a "system
override", which is when the request is made with the `authority-roles` header
being set to `1` (and the other `authority` headers being cleared). This is
necessary for flows that require the system to execute a privileged action on
behalf of the client.

It's very important that any confidential data that is fetched in this manner
do not get propagated back to the client.

These system overrides should be used sparingly, only utilized when deemed
absolutely necessary after careful design. Most actions can be done with just
the client's authority, and most actions that are denied due to the client's
authority being insufficient ought to be denied.

## External communication

"External" communication refers to communication between the server and the
client. Although this foundation takes care of authentication on the back-end,
an understanding of the protocol is still required to develop a compatible
client application.

### All requests

To access restricted resources, the client must include the following header in
its request:

```
authorization: Bearer SOME_ID_TOKEN
```

`SOME_ID_TOKEN` should be replaced with the ID token received from the server.

Based on the identity and roles of the user that this ID token was generated
for, the destination service will decide whether to accept or deny the request.
Naturally, the content of the response is entirely dependent on this service.

### Login (generate new refresh token and ID token)

The client should send a `POST` request to the `/api/login` endpoint. The
request body must contain the user's credentials in JSON format as such:

```
{
  "credentials": {
    "name": "my_username",
    "password": "my_password"
  }
}
```

`my_username` and `my_password` should be replaced with the user's credentials.

If the credentials are valid, the server will respond with status code 200. The
body will contain the refresh and ID tokens in JSON format as such:

```
{
  "refreshToken": "some_refresh_token",
  "idToken": "some_id_token"
}
```

If the credentials are invalid, the server will respond with status code 401.

### Generate new ID token (using refresh token)

The client should send a `POST` request to the `/api/login` endpoint. The
request body must contain the refresh token in JSON format as such:

```
{
  "refreshToken": "some_refresh_token"
}
```

`some_refresh_token` should be replaced with the refresh token received from the
server.

If the token is valid, the server will respond with status code 200. The body
will contain the ID token in JSON format as such:

```
{
  "idToken": "some_id_token"
}
```

If the token is invalid, the server will respond with status code 401.

### Logout

The client should send a `POST` request to the `/api/logout` endpoint. The
request body should contain the refresh token in JSON format as such:

```
{
  "refreshToken": "some_refresh_token"
}
```

`some_refresh_token` should be replaced with the refresh token received from the
server.

The server will unconditionally respond with status code 200, even if the
refresh token is invalid or the request body is malformed and no action is
taken.

Note that the ID token is not sent; there is no need to notify the server that
an ID token should be revoked. The account service treats an ID token as invalid
if its parent refresh token has been revoked.

## Philosophy

When a request arrives, the server must make a decision on whether the request
should be accepted or denied. To make this decision, the following are required:

- The identity of the client and their roles (standard user, admin, etc.)
- An understanding of what the request is trying to do (private user data
access, admin-only action, etc.)
- The internal state of the application model (e.g. only users that have
completed some set of steps may execute some action)

With this in mind, the question, then, is: who should be responsible for making
this decision?

### Approach: Front-loading access control

"Front-loading" access control means pushing onto the account service the entire
responsibility of deciding whether to allow a request (enabling the other
services to operate with the assumption that all the requests that make it to
them are authorized). There are two separate ways to go about this:

- The account service is allowed to utilize business logic. This is required in
  order to understand what the request is trying to do as well as observe the
  state of the application model. Functionally, this fulfills the access control
  requirements, but it manifests an avalanche of issues from a development
  perspective:
  - Each time a new service is added to the system or an existing service is
  modified, the account service will have to be updated. This implies that there
  is tight coupling between the account service and the other services.
  - The account service will inevitably have to invoke other services to query
  for information that it requires in order to make its decision. This adds
  complexity and latency, and it again demonstrates tight coupling.
  - The account service will grow absolutely massive in both size and
  complexity, making it impossible to maintain.
- The account service is not allowed to utilize business logic. This means that
  it has no way of understanding the request's action and no way of observing
  the application model's state. This significantly reduces the granularity of
  access control, essentially rendering the authentication system useless for
  the vast majority of applications.

Neither option seems ideal.

### Approach: Back-loading access control

"Back-loading" access control means eliminating the account service altogether.
In this scenario, the individual services have to handle each request in its raw
form without any extra information. While this allows for granular filtering, it
hinders development and adds latency, as each service is required to handle
authentication from scratch. Additionally, in cases where a service has to
invoke another service, the invoked service will do redundant authentication,
adding even more latency. This is exacerbated by the fact that service calls
could potentially chain quite deep, adding this overhead many times over.
Ultimately, there is unnecessary duplication in both code and runtime execution,
not to mention the added complexity to each service.

This doesn't seem ideal either.

### Solution: Shared responsibility

By splitting the responsibility of access control between the authentication
service and the destination service, the problems listed above are solved.

1. The account service identifies the client and fetches their roles. This
information, along with the original request, is forwarded to the destination
service.
2. The destination service uses the identification information along with its
understanding of the request in the context of the application model to make the
final decision on whether the request should be accepted.

This setup brings the following benefits:

- The account service has no need to understand what the request is trying to
do. All it cares about is the authorization token provided in the header. This
completely frees the account service from having to understand any business
logic whatsoever. As a result, the account service is lightweight, standalone,
and reusable.
- The destination service is enabled to finely filter through requests without
the overhead of deciphering tokens and querying sessions. Each service already
understands its own domain, so there is no change in the scope that the service
operates within. Provided with the identification information from the
account service, it is well-equipped to make the final decision on whether a
request should be processed.

## Flows

### Login via credentials

![Flow diagram](docs/credential-login-flow.png)

### Generate new ID token via refresh token

![Flow diagram](docs/refresh-token-login-flow.png)

### Logout

![Flow diagram](docs/logout-flow.png)

### Client identification

![Flow diagram](docs/identification-flow.png)

### Account delete

![Flow diagram](docs/account-delete-flow.png)

## Internal concerns within a microservice

*Note*: There is a shift in scope for this section. As this section discusses
matters that are internal to a single microservice, the term "service" in this
section refers to the layer in the software stack of one microservice, not a
node in the greater microservice network. A microservice can typically be broken
down into the controller, service, and repository. "Service" here is referring
to the stack layer that encapsulates the business logic.

### Validation

**Q: Which component or layer in the system is responsible for making sure that
the only inputs that make it through are the ones that make sense in the context
of the domain?**

Validation is a responsibility shared amongst the different layers of the
software stack. There are small differences between different languages in how
this responsibility gets divided, but the core idea remains constant. The two
diagrams below provide a visual overview on the setup.

![Validation by tier](docs/validation-by-tier.png)

![Validation by area](docs/validation-by-area.png)

The three layers are as follows:

- **Controller**<br>This layer does not explicitly try to do any validation but
does so implicitly by dropping requests (i.e. responding with status code 400)
that are malformed on the HTTP/JSON (or any other data representation method)
level.<br>The controller maps the HTTP data into whatever format the underlying
service can accept, and it does no more than that. It does not do any further
validation; it does the bare minimum to enable the service to operate with the
request.<br>With a strongly-typed language like Java, the controller naturally
filters out inputs that don't align with the expected structure (class). This is
imposed/provided by the language itself, as parsing would be done into a
pre-defined type.<br>With a weakly typed language like Javascript, the
controller can get away with covering less ground. It would only deny requests
that aren't possible to parse into any value regardless of type. This is because
the service cannot specify types for its function parameters, so it would
validate its inputs against its schemas anyways (in order to be well-defined and
robust). Thus, there is no need for the controller to do any validation beyond
the parsing it already does; that will inevitably be covered by the service.

- **Service**<br>The service is the main validator. It validates the input by
applying the domain's rules. These rules are the strictest and compose a proper
superset of all the rules imposed by the other layers. In other words, any input
that passes the service layer's validation will pass that of any other
layer.<br>As described in the controller section, a service in a weakly typed
language will carry more responsibility than one in a strongly typed language,
as the former has no guarantee about its inputs' types and should manually
validate them.

- **Repository**<br>Although the repository does its own validation, it is only
for the sake of being well-defined and robust as a standalone component. It does
not add any surface area to the validation done for the system as a whole. This
is because there should be no scenario where the domain rules deem an input as
legal but the system cannot store it due to the repository rejecting it. Such an
incident would imply a major flaw in either the configuration or choice of the
storage tool.<br>This implies that any validation done by the repository will be
entirely redundant. This initially seems like something to be avoided, but it
makes sense from the perspective of the repository itself. Each software
component is responsible for itself, and making assumptions about the caller is
in general a bad practice.<br>If avoiding redundancy is a priority, one may
choose to modify the service instead, where it can rely on the validation that
it knows the repository will do. Whereas "knowledge" about the service from the
repository's perspective is based on assumptions, the service does indeed know
the behavior of the repository and its validation. Validation coverage is a part
of each component's public interface, and the service is an invoker of the
repository. However, there are other complications to doing this, such as error
handling order; these will not be discussed here. In summary, there is merit to
the repository doing its validation despite redundancy.

### Error handling

**Q: When a subroutine throws an error/exception, should the calling component
re-map it into a type defined within the domain?**

Yes. Errors (or exceptions in Java), by name, seem like dreadful entities that
only occur when a problem exists with the code. However, this isn't the case; an
error is simply a form of output from a unit of code. In the traditional sense,
the return value is a function's way of sending information back to its caller.
Similarly, an error conveys some piece of information about the result of the
operation. It is essentially just another channel through which information is
sent from the subroutine to the caller.

![Information channels from the subroutine to the caller](docs/subroutine-outputs.png)

This implies that, just as the return value is a part of the public interface of
a function, the error should also be defined within the public interface. This
way, the calling code is aware of all possible outcomes and can react
accordingly.

Being a part of the public interface, an error should always be of a type from
the domain managed by the subroutine. Any other internal error that the
subroutine encounters should be translated into an instance of a domain error
before being propagated back to the caller.

![Error translation](docs/error-translation.png)

This behavior brings the following benefits:

- The caller has no need to handle miscellaneous error types. If a subroutine
fails to declare the complete set of errors that it can possibly throw, the
developer is often required to figure it out via manual testing, which is a
painful and time-consuming process. When a function restricts its error outputs
to a well-defined set of types that it controls, this problem goes away.
- The function does not leak any information about its internal implementation.
This is beneficial both as a security measure and a development principle. An
interface should never be tied to a specific implementation. Doing so prohibits
the consumer of the interface from freely switching out the underlying
implementation without making code changes. Without the error translation, a
caller may have had to resort to handling implementation-specific errors, which
will likely lead to broken code if this implementation gets switched out.

If done incorrectly, error translation can result in a loss of information. An
error contains valuable information about what exactly happened internally that
prevented a value from being returned. There are multiple approaches to capture
this information:

- Nest the original error within an existing domain error type.
- Define a new error type within the domain that exactly expresses the same
meaning as the original error.
- Log the original error and throw a more general domain error.

The approach taken depends on the needs of the calling code. If it's expected
that the caller would immediately require more granular information on what
caused a value from being returned, either wrapping the original error or
defining a specific error type is probably the wiser choice. Otherwise, if there
is no anticipated need for the caller to understand what caused the error (i.e.
the reaction is the same regardless of the cause), logging is likely sufficient.
