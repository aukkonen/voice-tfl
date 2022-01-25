# Voice-TFL
Voice enabled journey planner for London public transport built with [Speechly](https://github.com/speechly/speechly) and Transport For London Unified API.

See it in action at https://aukkonen.github.io/voice-tfl

The design is optimised for mobile devices, and hence looks a bit silly on a desktop.

## Running locally
Run git clone, and then
```
make imports
npm intall
npm start
```
That should be it.

## Speechly configuration

Is in the `config` directory. You will need the [Speechly Command Line Tool](https://docs.speechly.com/dev-tools/command-line-client/) to deploy it, as well as a valid Speechly App Id. The latter you can get by signing up on the [Speechly Dashboard](https://www.speechly.com/dashboard).
