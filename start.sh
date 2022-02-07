#!/bin/bash

docker run -p 3000:3000 \
        --rm \
        -it \
        --name iot-uniovi-api \
        --network host \
        -m "300M" --memory-swap "1G" \
        iot-uniovi-api