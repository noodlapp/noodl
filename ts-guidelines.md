# TS guidelines

This is a makeshift document that could be good in the future when we grow. maybe.


## TSFixme
Since the dawn of time ts-devs have been aliasing `any` to the type `TSFixme` to be able to leave traces in the codebase for whenever they cant be bothered to do proper types, but still want to leave a trail for themselves to know what to fix where. We keep this tradition alive.
## any vs unknown
We shoud strive to use `unknown` instead of `any`.

In short `unknown` is the type-safe counterpart of `any`. Anything is assignable to `unknown`, but `unknown` isn't assignable to anything but itself and any without a type assertion or a control flow based narrowing. Likewise, no operations are permitted on an `unknown` without first asserting or narrowing to a more specific type.

TLDR: use `TSFixme` when youre lazy, and `unknown` when the value is actually unknown.