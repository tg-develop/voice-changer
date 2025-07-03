import numpy as np
from time import time
from typing import Union
from msgspec import msgpack

from fastapi import APIRouter, Request, Form
from fastapi.responses import Response, PlainTextResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from const import get_edition, get_version
from voice_changer.VoiceChangerManager import VoiceChangerManager

import logging
logger = logging.getLogger(__name__)


class MMVC_Rest_VoiceChanger:
    def __init__(self, voiceChangerManager: VoiceChangerManager):
        self.voiceChangerManager = voiceChangerManager
        self.router = APIRouter()
        self.router.add_api_route("/test", self.test, methods=["POST"])
        self.router.add_api_route("/edition", self.edition, methods=["GET"])
        self.router.add_api_route("/version", self.version, methods=["GET"])
        self.router.add_api_route("/info", self.get_info, methods=["GET"])
        self.router.add_api_route("/update_settings", self.post_update_settings, methods=["POST"])


    def edition(self):
        return PlainTextResponse(get_edition())


    def version(self):
        return PlainTextResponse(get_version())


    async def test(self, req: Request):
        recv_timestamp = round(time() * 1000)
        try:
            data = await req.body()
            ts, voice = msgpack.decode(data)

            unpackedData = np.frombuffer(voice, dtype=np.int16).astype(np.float32) / 32768

            out_audio, vol, perf, err = self.voiceChangerManager.change_voice(unpackedData)
            out_audio = (out_audio * 32767).astype(np.int16).tobytes()

            if err is not None:
                error_code, error_message = err
                return Response(
                    content=msgpack.encode({
                        "error": True,
                        "details": {
                            "code": error_code,
                            "message": error_message,
                        },
                    }),
                    headers={'Content-Type': 'application/octet-stream'},
                )

            ping = recv_timestamp - ts
            send_timestamp = round(time() * 1000)
            return Response(
                content=msgpack.encode({
                    "error": False,
                    "audio": out_audio,
                    "perf": perf,
                    "vol": vol,
                    "ping": ping,
                    "sendTimestamp": send_timestamp,
                }),
                headers={'Content-Type': 'application/octet-stream'},
            )

        except Exception as e:
            logger.exception(e)
            return Response(
                content=msgpack.encode({
                    "error": True,
                    "timestamp": 0,
                    "details": {
                        "code": "GENERIC_REST_SERVER_ERROR",
                        "message": "Check command line for more details.",
                    },
                }),
                headers={'Content-Type': 'application/octet-stream'},
            )

    def get_info(self):
        try:
            info = self.voiceChangerManager.get_info()
            json_compatible_item_data = jsonable_encoder(info)
            return JSONResponse(content=json_compatible_item_data)
        except Exception as e:
            logger.exception(e)

    def post_update_settings(self, key: str = Form(...), val: Union[int, str, float] = Form(...)):
        try:
            info = self.voiceChangerManager.update_settings(key, val)
            json_compatible_item_data = jsonable_encoder(info)
            return JSONResponse(content=json_compatible_item_data)
        except Exception as e:
            logger.exception(e)
