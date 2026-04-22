# Juice Token Architecture

## Purpose

This document explains how tokens should be structured in Juice as the system grows.

The existing token system doc explains what tokens are.
This document focuses on how token architecture should be reasoned about.

## Core Split

Juice should preserve this split:

* `tokens/` define design data
* `styles/` consume tokens and emit selectors

That split is important because it keeps:

* raw design values separate from public API
* selectors easier to evolve
* future generation/config tooling possible

## Token Families

Juice currently has several important token families:

* colors
* gradients
* fonts
* themes

Each family should follow the same architectural idea:

* values first
* selector behavior second

## Good Token Questions

When adding a new token family, ask:

* is this raw design data?
* should this be reusable independent of selectors?
* should this live in `tokens/` rather than `styles/`?

## Good Style Questions

When adding style output, ask:

* is this exposing token data through the Juice attribute API?
* is this emitting selectors?
* is this better placed in `styles/`?

## Example Direction

The blue gradient refactor showed the healthier pattern:

* token files define gradient values
* style files import those values and emit selectors

That direction should be repeated where needed.

## Themes and Tokens

Themes should consume tokens and define identity contracts.

They should not bypass the token system entirely.

## Summary

The token architecture of Juice should stay disciplined:

* tokens define values
* styles define selectors
* themes define identity
* layout primitives remain separate from token concerns
