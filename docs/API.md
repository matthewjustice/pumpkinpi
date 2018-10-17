# **PumpkinPi API**

This document describes the web API for PumpkinPi.

# LED capabilities

**Enumerate LEDs**
----

Returns the collection of all LEDs as JSON.

* **URL**

  /api/leds

* **Method**

  `GET`
  
*  **URL Params**

   None

* **Data Params**

    None

* **Success Response**
  
  **Code:** 200 <br />
  **Content:** `[
    {
        "name": "LED 1",
        "status": "off",
        "id": "led1"
    },
    {
        "name": "LED 2",
        "status": "off",
        "id": "led2"
    }
]`
 
* **Sample Call**

  ```sh
  curl -X GET \
    http://localhost:5000/api/leds
  ```

**Get an LED by id**
----

Returns a single LED as JSON.

* **URL**

  /api/leds/{id}

* **Method:**

  `GET` 
  
*  **URL Params**

   **Required:**
 
   `id=[string]`

* **Data Params**

  None

* **Success Response**

  **Code:** 200 <br />
  **Content:** `{
    "name": "LED 1",
    "status": "off",
    "id": "led1"
}`
 
* **Error Response**

    **Code:** 404 Not Found <br />
    **Content:** `{"message": "led led3 does not exist"}`

* **Sample Call**
  ```sh
  curl -X GET \
    http://localhost:5000/api/leds/led1
  ```

**Update an LED's status**
----

Sets an LED's status to on or off. Returns a single LED as JSON.

* **URL**

  /api/leds/{id}

* **Method**

  `PUT` 
  
*  **URL Params**

   **Required:**
   `id=[string]`

* **Data Params**

  **Required:**
 
   `{"status": [string]}` <br />
    Valid status values are "on" or "off"

* **Success Response**

  **Code:** 200 <br />
  **Content:** `{
    "name": "LED 1",
    "status": "off",
    "id": "led1"
}`
 
* **Error Response**

    **Code:** 404 Not Found <br />
    **Content:** `{"message": "led led3 does not exist"}`

* **Sample Call**
  ```sh
  curl -X PUT \
    http://localhost:5000/api/leds/led1 \
    -H 'Content-Type: application/json' \
    -d '{"status": "on"}'
  ```
* **Notes**

    Since the `status` field is the only part of the LED object that can be modified, the body of the PUT only requires that field. If other fields are included they will be ignored.

# Sound capabilities

**Enumerate sounds**
----

Returns the collection of all sounds that can be played, as JSON.

* **URL**

  /api/sounds

* **Method**

  `GET`
  
*  **URL Params**

    None

* **Data Params**

    None

* **Success Response**
  
  **Code:** 200 <br />
  **Content:** `[
    {
        "title": "Hello",
        "id": "hello.wav"
    },
    {
        "title": "Happy Halloween!",
        "id": "happy.wav"
    }
]`
 
* **Sample Call**

  ```sh
  curl -X GET \
    http://localhost:5000/api/sounds
  ```

**Get a sound by id**
----
Returns a single sound object as JSON.

* **URL**

  /api/sounds/{id}

* **Method:**

  `GET` 
  
*  **URL Params**

   **Required:** `id=[string]`

* **Data Params**

  None

* **Success Response**

  **Code:** 200 <br />
  **Content:** `{
    "title": "Hello",
    "id": "hello.wav"
}`
 
* **Error Response**

    **Code:** 404 Not Found <br />
    **Content:** `{ "message": "sound xyz does not exist" }`

* **Sample Call**
  ```sh
  curl -X GET \
    http://localhost:5000/api/sounds/hello.wav
  ```

**Play a sound**
----

Plays a sound on the Raspberry Pi speaker.

* **URL**

  /api/sounds/{id}

* **Method**

  `PUT` 
  
*  **URL Params**

   **Required:**
   `id=[string]`

* **Data Params**

  None

* **Success Response**

  **Code:** 200 <br />
  **Content:** `{
    "title": "Hello",
    "id": "hello.wav"
}`
 
* **Error Response**

    **Code:** 404 Not Found <br />
    **Content:** `{ "message": "sound zyz does not exist" }`

* **Sample Call**
  ```sh
  curl -X PUT \
    http://localhost:5000/api/sounds/hello.wav
  ```
* **Notes**

    The PUT method was chosen since the call causes an action to occur on the server (Raspberry Pi). The state of the underlying sound object isn't modified, so no body is required in the PUT. PUTing any existing sound object by id just means "play this sound."

# Feature capabilities

**Enumerate features**
----

Returns the collection of all features as JSON. Features are capabilities of the PumpkinPi that can be configured.

* **URL**

  /api/features

* **Method**

  `GET`
  
*  **URL Params**

   None

* **Data Params**

    None

* **Success Response**
  
  **Code:** 200 <br />
  **Content:** `[
    {
        "enabled": false,
        "id": "motion-sensor"
    }
]`
 
* **Sample Call**

  ```sh
  curl -X GET \
    http://localhost:5000/api/features
  ```

**Get a feature by id**
----

Returns a single feature as JSON.

* **URL**

  /api/features/{id}

* **Method:**

  `GET` 
  
*  **URL Params**

   **Required:**
 
   `id=[string]`

* **Data Params**

  None

* **Success Response**

  **Code:** 200 <br />
  **Content:** `{
    "enabled": false,
    "id": "motion-sensor"
}`
 
* **Error Response**

    **Code:** 404 Not Found <br />
    **Content:** `{ "message": "feature xyz does not exist" }`

* **Sample Call**
  ```sh
  curl -X GET \
    http://localhost:5000/api/features/motion-sensor
  ```

**Modify a feature setting**
----

Modifies a feature setting. Returns the modified feature as JSON.

* **URL**

  /api/features/{id}

* **Method**

  `PUT` 
  
*  **URL Params**

   **Required:**
   `id=[string]`

* **Data Params**

  **Required:**
 
  for id=`motion-sensor`<br />
   `{"enabled": boolean}` <br />

  for id=`webcam`<br />
   `{"brightness": int}` <br />
   or <br />
   `{"brightness": "auto-toggle"}` <br />

* **Success Response**

  **Code:** 200 <br />
  **Content:** `{ "enabled": true, "id": "motion-sensor" }`
 
* **Error Response**

    **Code:** 404 Not Found <br />
    **Content:** `{ "message": "feature xyz does not exist" }`

* **Sample Call**
  ```sh
  curl -X PUT \
    http://localhost:5000/api/features/motion-sensor \
    -H 'Content-Type: application/json' \
    -d '{"enabled": true}'
  ```
* **Notes**

    Since the `enabled` or `brightness` field is the only part of the feature object that can be modified, the body of the PUT only requires that field. If other fields are included they will be ignored.

    For webcam brightness, valid values are 0 through 100 (representing a percentage), or `auto-toggle`, which is a special case that toggles the brightness between a high and low value on every capture. `auto-toggle` is used to work around a problem with certain webcams.

# Photos capabilities

**Enumerate photos**
----

Returns the collection of all photo data as JSON.

* **URL**

  /api/photos

* **Method**

  `GET`
  
*  **URL Params**

   None

* **Data Params**

    None

* **Success Response**
  
  **Code:** 200 <br />
  **Content:** `[
    {
        "id": "2018-10-11T14-55-09.415Z.jpg",
        "path": "/photos/2018-10-11T14-55-09.415Z.jpg"
    },
    {
        "id": "2018-10-11T14-55-22.171Z.jpg",
        "path": "/photos/2018-10-11T14-55-22.171Z.jpg"
    }
]`
 
* **Sample Call**

  ```sh
  curl -X GET \
    http://localhost:5000/api/photos
  ```

**Get a single photo by id**
----

Returns a single photo's data as JSON. If the provided id is "latest", the most recent photo will be returned.

* **URL**

  /api/photos/{id}

* **Method:**

  `GET` 
  
*  **URL Params**

   **Required:**
 
   `id=[string]`

* **Data Params**

  None

* **Success Response**

  **Code:** 200 <br />
  **Content:** `{
    "id": "2018-10-11T14-55-22.171Z.jpg",
    "path": "/photos/2018-10-11T14-55-22.171Z.jpg"
  }`
 
* **Error Response**

    **Code:** 404 Not Found <br />
    **Content:** `{ "message": "photo xyz does not exist" }`

    or, when requesting latest:

    **Code:** 404 Not Found <br />
    **Content:** `{ "message": "no photos have been captured" }`

* **Sample Call**
  ```sh
  curl -X GET \
    http://localhost:5000/api/photos/pumpkinpi-2018-10-09-123.jpg
  ```
  or
  ```sh
  curl -X GET \
    http://localhost:5000/api/photos/latest
  ```

**Capture a photo**
----

Requests that a photo be captured on the Pumpkin Pi.

* **URL**

  /api/photos/{id}

* **Method**

  `POST` 
  
*  **URL Params**

   None

* **Data Params**

  None

* **Success Response**

  **Code:** 200 <br />
  **Content:** `{
    "id": "2018-10-11T14-58-37.065Z.jpg",
    "path": "/photos/2018-10-11T14-58-37.065Z.jpg"
  }`
 
* **Error Response**

    **Code:** 500 <br />
    **Content:** `{
    "message": "unable to capture photo"
    }`

* **Sample Call**
  ```sh
  curl -X POST \
    http://localhost:5000/api/photos
  ```
  