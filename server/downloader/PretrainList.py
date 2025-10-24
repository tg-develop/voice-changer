from settings import ServerSettings

params = ServerSettings()

pitch_extractors = {
    "crepe_full_onnx": {
        "name": "Crepe Full (Onnx)",
        "url": "https://huggingface.co/wok000/weights/resolve/7a376af24f4f21f9d9e24160ed9d858e8a33bf93/crepe/onnx/full.onnx",
        "saveTo": "pretrain/pitch_extractor/crepe_onnx_full",
        "hash": "e9bb11eb5d3557805715077b30aefebc",
        "type": "onnx",
        "mandatory": False,
    },
    "crepe_tiny_onnx": {
        "name": "Crepe Tiny (Onnx)",
        "url": "https://huggingface.co/wok000/weights/resolve/7a376af24f4f21f9d9e24160ed9d858e8a33bf93/crepe/onnx/tiny.onnx",
        "saveTo": "pretrain/pitch_extractor/crepe_onnx_tiny",
        "hash": "b509427f6d223152e57ff2aeb1b48300",
        "type": "onnx",
        "mandatory": False,
    },
    "crepe_full": {
        "name": "Crepe Full (Pytorch)",
        "url": "https://github.com/maxrmorrison/torchcrepe/raw/745670a18bf8c5f1a2f08c910c72433badde3e08/torchcrepe/assets/full.pth",
        "saveTo": "pretrain/pitch_extractor/crepe_full.pth",
        "hash": "2ab425d128692f27ad5b765f13752333",
        "type": "pytorch",
        "mandatory": False,
    },
    "crepe_tiny": {
        "name": "Crepe Tiny (Pytorch)",
        "url": "https://github.com/maxrmorrison/torchcrepe/raw/745670a18bf8c5f1a2f08c910c72433badde3e08/torchcrepe/assets/tiny.pth",
        "saveTo": "pretrain/pitch_extractor/crepe_tiny.pth",
        "hash": "eec11d7661587b6b90da7823cf409340",
        "type": "pytorch",
        "mandatory": False,
    },
    "rmvpe": {
        "name": "RMVPE",
        "url": "https://huggingface.co/wok000/weights/resolve/4a9dbeb086b66721378b4fb29c84bf94d3e076ec/rmvpe/rmvpe_20231006.pt",
        "saveTo": "pretrain/pitch_extractor/rmvpe.pt",
        "hash": "7989809b6b54fb33653818e357bcb643",
        "type": "pytorch",
        "mandatory": True,
    },
    "rmvpe_onnx": {
        "name": "RMVPE (Onnx)",
        "url": "https://huggingface.co/deiteris/weights/resolve/5040af391eb55d6415a209bfeb3089a866491670/rmvpe_upd.onnx",
        "saveTo": "pretrain/pitch_extractor/rmvpe.onnx",
        "hash": "9c6d7712f84d487ae781b0d7435c269b",
        "type": "onnx",
        "mandatory": True,
    },
    "fcpe": {
        "name": "FCPE",
        "url": "https://github.com/CNChTu/FCPE/raw/819765c8db719c457f53aaee3238879ab98ed0cd/torchfcpe/assets/fcpe_c_v001.pt",
        "saveTo": "pretrain/pitch_extractor/fcpe.pt",
        "hash": "933f1b588409b3945389381a2ab98014",
        "type": "pytorch",
        "mandatory": False,
    },
    "fcpe_onnx": {
        "name": "FCPE (Onnx)",
        "url": "https://huggingface.co/deiteris/weights/resolve/6abbb0285b1fc154e112b3c002ae63e1c1733d53/fcpe.onnx",
        "saveTo": "pretrain/pitch_extractor/fcpe.onnx",
        "hash": "6a7b11db05def00053102920d039760f",
        "type": "onnx",
        "mandatory": False,
    },
}

embedders = {
    "hubert_base": {
        "name": "ContentVec / Hubert",
        "url": "https://huggingface.co/wok000/weights_gpl/resolve/c2f3e4a8884dba0995347dfe24dc0ad40acb9eb7/content-vec/contentvec-f.onnx",
        "saveTo": "pretrain/embedder/content_vec_500.onnx",
        "hash": "ab288ca5b540a4a15909a40edf875d1e",
        "type": "onnx",
        "mandatory": True,
    },
    "spin_base": {
        "name": "Spin",
        "url": "https://huggingface.co/tg-develop/spin_rvc/resolve/main/spin.onnx",
        "saveTo": "pretrain/embedder/spin_base.onnx",
        "hash": "d2da4abf1eaae250e87d128f399f891b",
        "type": "onnx",
        "mandatory": True,
    },
    "spin_v2": {
        "name": "Spin V2",
        "url": "https://huggingface.co/tg-develop/spin_rvc/resolve/main/spin_v2.onnx",
        "saveTo": "pretrain/embedder/spin_v2.onnx",
        "hash": "4983330cc048f7fc08646c33f8e4607c",
        "type": "onnx",
        "mandatory": False,
    },
}