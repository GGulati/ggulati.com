---
title: "Coding Jarvis in Python in 2016"
date: "2016-02-24"
slug: "coding-jarvis-in-python-2016"
excerpt: "It's tough for an aspiring Iron Man to work on creating their personal AI assistant on the weekends."
---

It's tough for an aspiring Iron Man to work on creating their personal AI assistant on the weekends. Like any other time-pressured inventor without a PhD in computer science and linguistics, I decided to use a library for speech recognition and synthesis. Fortunately, Python offers several choices. Unfortunately, many of simply them don't work any more. I will discuss the ones that are still functional and can be used with Python 2.7 and Python 3.

My AI assistant is actually a little humbler - I call it Samwise.

## Jarvis's Mouth: Text-to-Speech

We've all heard of Google's AI initiatives, so it should come as little surprise that they offer a RESTful way to do voice recognition and speech synthesis. The Python library that nicely wraps their text-to-speech API is [gTTS](https://pypi.org/project/gTTS/).

gTTS takes advantage of Google Translate's voice capability and downloads its response to a parameterized GET request into an mp3 file. However, you would need one of the pygame, pyglet + AVBin, or VLC Player python libraries to play that mp3. This is additional complexity and dependency bloat.

I also found [pyttsx](https://github.com/nateshmbhat/pyttsx3), which is a great offline option. For Windows, you need to install PyWin32 and make sure you have the Microsoft Speech API installed.

## Jarvis's Ears: Speech Recognition

[SpeechRecognition](https://pypi.org/project/SpeechRecognition/) is a wonderful, up to date library that offers to use CMU's open source Sphinx project, Google services, or Wit.ai to convert audio input into text. If you intend to recognize microphone input, you'll also need PyAudio.

## Jarvis's Brain: The Code

I ultimately opted to use pyttsx and SpeechRecognition/Sphinx because they are offline and free, with great open source licenses.

```python
import speech_recognition
import pyttsx

speech_engine = pyttsx.init('sapi5')
speech_engine.setProperty('rate', 150)

def speak(text):
    speech_engine.say(text)
    speech_engine.runAndWait()

recognizer = speech_recognition.Recognizer()

def listen():
    with speech_recognition.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source)

    try:
        return recognizer.recognize_sphinx(audio)
    except speech_recognition.UnknownValueError:
        print("Could not understand audio")
    except speech_recognition.RequestError as e:
        print("Recog Error; {0}".format(e))

    return ""

speak("Say something!")
speak("I heard you say " + listen())
```

The code itself is straightforward, as anyone would hope after spending a couple of hours researching this on a weekend. Try it out!
