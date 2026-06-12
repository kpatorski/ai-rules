# Domain Examples

## Reservation Engine / Deskify-style Domain

Typical concepts:
- availability windows
- reservation intents
- desk reservations
- booking cycles
- time ranges
- workplace scope

Preferred use-case naming:
```java
CreateAvailabilityWindow
ReserveTimeRange
CancelReservation
CreateBookingCycle
AssignDeskReservation
```

Preferred test naming:
```java
reservationIsRejectedWhenTimeRangeOverlaps()
nextBookingCycleIsCreatedBeforeCurrentCycleEnds()
deskReservationIsCreatedFromAcceptedIntent()
```

Avoid:
```java
ReservationManager
BookingCycleHelper
DeskResolver
```

---

## Voting / Votify-style Domain

Typical concepts:
- resolution
- voting
- resident
- quorum
- deadline
- housing community

Preferred use-case naming:
```java
CreateResolution
VoteInFavor
VoteAgainst
CloseVoting
AddResident
```

Preferred test naming:
```java
voteIsRejectedAfterDeadline()
resolutionIsAcceptedWhenQuorumIsReached()
residentCannotVoteTwiceForTheSameResolution()
cancelledResolutionCannotBeVotedOn()
```

Avoid:
```java
VoteManager
ResolutionHelper
CommunityHandler
```
