import asyncio
import logging
from typing import Dict, Any

from downloader.Downloader import download
from settings import ServerSettings
from Exceptions import PretrainDownloadException
from .PretrainList import pitch_extractors, embedders

logger = logging.getLogger(__name__)

async def downloadWeight(params: ServerSettings):
    logger.info('Loading weights.')
    
    # Combine all model dictionaries
    all_models = {**pitch_extractors, **embedders}
    
    # Only include mandatory models for download
    files_to_download = []
    for model_id, model_info in all_models.items():
        if model_info.get('mandatory', False):
            files_to_download.append({
                'url': model_info['url'],
                'saveTo': model_info['saveTo'],
                'hash': model_info['hash']
            })
    
    if not files_to_download:
        logger.info('No mandatory models to download.')
        return

    tasks: list[asyncio.Task] = []
    for file in files_to_download:
        tasks.append(asyncio.ensure_future(download(file)))
    fail = False
    for i, res in enumerate(await asyncio.gather(*tasks, return_exceptions=True)):
        if isinstance(res, Exception):
            logger.error(f'Failed to download or verify {files_to_download[i]["saveTo"]}')
            fail = True
            logger.exception(res)
    if fail:
        raise PretrainDownloadException()

    logger.info('All weights are loaded!')
