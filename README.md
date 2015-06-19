# Getting Started

``` bash
git update-index --assume-unchanged config/global.json
```

Now open `Parse/config/global.json` and change the `_default` field to
`Night Owl (Debug: <username>)`

# Assignment State Codes

| Description                             | State |
|-----------------------------------------|-------|
| Image Uploading                         | 0     |
| Waiting For Tutor                       | 1     |
| Tutor Assigned                          | 2     |
| Completed                               | 3     |
| User Flagged: Incorrect Answer          | 4     |
| User Flagged: Not Enough Steps          | 5     |
| User Flagged: Blurry/Messy Handwriting  | 6     |
| Tutor Flagged: Blurry/Messy Handwriting | 7     |
| Tutor Flagged: To Many Questions        | 8     |
| Tutor Deleted                           | 9     |

# Message State Codes

| Description       | State |
|-------------------|-------|
| Notification      | 0     |
| Created by Tutor  | 1     |
| Created by User   | 2     |

# Push Notifications

| Description  | Action                                       |
|--------------|----------------------------------------------|
| alert        | Shows message to user                        |
| sound        | Notification with sound (default: `default`) |
| action       | Primary action of notification, used for older app versions. |
| actions       | Multiple actions split by comma. Example: `user.reload, support.message` |

### Type of Actions

| Name                         | Action                                         | Fields             |
|------------------------------|------------------------------------------------|--------------------|
| questionsController.reload   | Reloads users questions view                   |                    |
| settingsController.reload    | Reloads users account & settings view          |                    |
| settings.reload              | Reloads cached settings                        |                    |
| subjects.reload              | Reloads cached settings                        |                    |
| user.reload                  | Reloads users account                          |                    |
| user.rate                    | Asks user to rate the app                      | message            |
| user.download                | Asks user to update the app                    | message            |
| user.message                 | Shows alert to user                            | title, message     |
| support.message              | Sends support message to user                  | message            |

### Example Push Notification

``` javascript
var user = Parse.User.current()
var pushQuery = new Parse.Query(Parse.Installation)

pushQuery.equalTo("user", user)

Parse.Push.send({
  where: pushQuery,
  data: {
    action: "settingsController.reload",
    actions: "settingsController.reload, user.message",
    alert: "Bob just joined Night Owl! Here's 2 free questions!",
    message: "Bob just joined Night Owl! Here's 2 free questions!",
    title:  "Thanks For Sharing",
    sound: "alert.caf"
  }
})
```
