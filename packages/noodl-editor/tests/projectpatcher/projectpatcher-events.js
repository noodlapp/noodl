import { applyPatches } from '@noodl-models/ProjectPatches/applypatches';

// Project settings
describe('Project patcher - events', function () {
    it('can patch send event nodes', function () {
        const project = {
            "name": "event-patcher-test",
            "components": [
                {
                    "name": "/App",
                    "graph": {
                        "connections": [
                        ],
                        "roots": [
                            {
                                "id": "4143a274-208c-debf-bd59-e399e0f8ee82",
                                "type": "Event Sender",
                                "x": -327.46819153012916,
                                "y": 305.4376377651178,
                                "parameters": {
                                    "channelName": "achannel"
                                },
                                "ports": [
                                    {
                                        "name": "One",
                                        "plug": "input",
                                        "type": {
                                            "name": "*",
                                            "allowConnectionOnly": true
                                        },
                                        "group": "Payload",
                                        "index": 1
                                    },
                                    {
                                        "name": "Two",
                                        "plug": "input",
                                        "type": {
                                            "name": "*",
                                            "allowConnectionOnly": true
                                        },
                                        "group": "Payload",
                                        "index": 2
                                    }
                                ],
                                "dynamicports": [],
                                "children": []
                            }
                        ]
                    },
                }
            ]
        }

        const after = {
            "name": "event-patcher-test",
            "components": [
                {
                    "name": "/App",
                    "graph": {
                        "connections": [
                        ],
                        "roots": [
                            {
                                "id": "4143a274-208c-debf-bd59-e399e0f8ee82",
                                "type": "Event Sender",
                                "x": -327.46819153012916,
                                "y": 305.4376377651178,
                                "parameters": {
                                    "channelName": "achannel",
                                    "payload": "One,Two"
                                },
                                "ports": [],
                                "dynamicports": [
                                ],
                                "children": []
                            },
                        ]
                    }
                }
            ]
        }

        applyPatches(project)
    
        expect(project).toEqual(after)
    })

});
