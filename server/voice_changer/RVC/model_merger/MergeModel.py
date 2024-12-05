from typing import Dict, Any
import os
from collections import OrderedDict
import torch
from voice_changer.ModelSlotManager import ModelSlotManager
from safetensors import safe_open
from voice_changer.utils.ModelMerger import ModelMergerRequest
from settings import ServerSettings
import json
import logging
logger = logging.getLogger(__name__)

def merge_model(params: ServerSettings, request: ModelMergerRequest):
    def extract(ckpt: Dict[str, Any]):
        a = ckpt["model"]
        opt: Dict[str, Any] = OrderedDict()

        opt["weight"] = {}
        for key in a.keys():
            if "enc_q" in key:
                continue
            opt["weight"][key] = a[key]
        return opt

    def load_weight(path: str):
        logger.info(f"Loading {path}...")
        if path.endswith('.safetensors'):
            with safe_open(path, 'pt', device='cpu') as cpt:
                state_dict = cpt.metadata()
                weight = { k: cpt.get_tensor(k) for k in cpt.keys() }
                config = json.loads(state_dict['config'])
        else:
            state_dict = torch.load(path, map_location='cpu')
            if "model" in state_dict:
                weight = extract(state_dict)
            else:
                weight = state_dict["weight"]
            config = state_dict['config']
        return weight, state_dict, config

    files = request.files
    if len(files) == 0:
        raise RuntimeError("No merge file.")

    weights = []
    alphas = []
    slotManager = ModelSlotManager.get_instance(params.model_dir)
    for f in files:
        strength = f.strength
        if strength == 0:
            continue
        slotInfo = slotManager.get_slot_info(f.slotIndex)

        filename = os.path.join(params.model_dir, str(f.slotIndex), os.path.basename(slotInfo.modelFile))  # slotInfo.modelFileはv.1.5.3.11以前はmodel_dirから含まれている。

        weight, state_dict, config = load_weight(filename)
        weights.append(weight)
        alphas.append(f.strength)

    alphas = [x / sum(alphas) for x in alphas]

    for weight in weights:
        if sorted(list(weight.keys())) != sorted(list(weights[0].keys())):
            raise RuntimeError("Failed to merge models.")

    merged: Dict[str, Any] = OrderedDict()
    merged["weight"] = {}
    logger.info("merge start.")
    for key in weights[0].keys():
        merged["weight"][key] = 0
        for i, weight in enumerate(weights):
            merged["weight"][key] += weight[key] * alphas[i]
    logger.info("merge done. write metadata.")

    merged["config"] = config
    merged["params"] = state_dict["params"] if "params" in state_dict else None
    merged["version"] = state_dict["version"] if "version" in state_dict else None
    merged["sr"] = state_dict["sr"]
    merged["f0"] = int(state_dict["f0"] == "1" or state_dict["f0"] == "True")
    try:
        # Some forks do not include info apparently (?)
        merged["info"] = state_dict["info"]
    except:
        pass
    merged["embedder_name"] = state_dict["embedder_name"] if "embedder_name" in state_dict else None
    merged["embedder_output_layer"] = state_dict["embedder_output_layer"] if "embedder_output_layer" in state_dict else None
    logger.info("write metadata done.")
    return merged
