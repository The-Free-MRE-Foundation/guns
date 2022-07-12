![](https://avatars.githubusercontent.com/u/108149048?s=400&u=fabc0cb4719e28dfba35e7fb0e4ffa0c47011917&v=4)
# Deployment
- How to deploy it to your own server:
```bash
git clone https://github.com/The-Free-MRE-Foundation/guns
cd guns/
npm install
npm run build
npm start
```
- How to deploy it to heroku:
	- create a github account if you don't have one
	- go to [this page](https://github.com/The-Free-MRE-Foundation/sounds), and fork the repo
	- create a [heroku](https://heroku.com) account if you don't have one
	- create a new app on heroku
	- go to deploy, and connect the new app to github
	- search "guns" and choose the repo you've just forked
	- wait for the deployment process to finish
	- click the "view app" button and copy the url of the new webpage, e.g.  
	`https://myguns.herokuapp.com/`
	- replace "https" in the copied url to "ws" or "wss" and remove the trailing slash, e.g.  
	`wss://myguns.herokuapp.com`
# Customization
## Create your own content pack
- go to [this page](https://account.altvr.com/content_packs/new), and create your own content pack (you can combine the content packs and use the doorbell, TTS buttons and the soundboard together)
- copy the url to the raw content of the content pack you've created, e.g.  
`https://account.altvr.com/api/content_packs/2043495985698571086/raw`
- pass the url of the content pack as a query parameter, e.g.  
`wss://mydoorbell.herokuapp.com?url=https://account.altvr.com/api/content_packs/2043495985698571086/raw`
## two types of guns
- A gun is an entity that can fire particle effects controlled by a trigger (clickable button).
- There are two types of guns: equippable guns and stand alone guns
## Equippable guns example:
```json
[
	{
		"name": "revolver",
		"attachPoint": "left-hand",
		"dimensions": {
			"width": 0.04,
			"height": 0.1,
			"depth": 0.25
		},
		"model": {
			"resourceId": "artifact:2044161675715674908",
			"transform": {
				"position": {
					"x": 0.0445,
					"y": 0,
					"z": 0.2255
				},
				"rotation": {
					"x": 0,
					"y": 0,
					"z": -90
				}
			}
		},
		"bullet": {
			"resourceId": "artifact:2044161675061363483",
			"transform": {
				"position": {
					"x": 0,
					"y": 0.0447,
					"z": 0.1548
				}
			},
			"ttl": 10
		}
	}
]
```
## Standalone guns example:
```json
[
	{
		"name": "confetti",
		"transform": {
			"position": {
				"x": 0,
				"y": 0,
				"z": 0
			}
		},
		"model": {
			"resourceId": "artifact:2044223538646221085",
			"transform": {
				"position": {
					"x": 0,
					"y": 0,
					"z": 0
				},
				"rotation": {
					"x": 0,
					"y": 0,
					"z": 0
				}
			}
		},
		"bullet": {
			"resourceId": "artifact:2044223538260345116",
			"transform": {
				"position": {
					"x": 0,
					"y": 0,
					"z": 0.06
				}
			},
			"ttl": 10
		},
		"trigger": {
			"transform": {
				"position": {
					"x": 0,
					"y": 0,
					"z": 0
				}
			},
			"dimensions": {
				"width": 0.05,
				"height": 0.05,
				"depth": 0.05
			}
		}
	}
]
```
## definitions:
- "transform" (optional) is the unity transform of the gun including position, rotation and scale
- "dimensions" (optional) is the dimension of the gun (used to defined the size of the collider of the gun menu)
- "trigger" (optional) defines the transform and dimensions of the trigger (clickable button)
- "bullet.ttl" defines the time to live of the bullet (particle effect)