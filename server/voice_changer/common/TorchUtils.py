import torch

def circular_write(new_data: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
    # Ensure 1-D contiguous tensors and matching device/dtype
    new_data = torch.as_tensor(new_data, device=target.device, dtype=target.dtype).reshape(-1).contiguous()
    target = target.reshape(-1).contiguous()

    # Determine the amount we can actually write
    write_size = min(new_data.shape[0], target.shape[0])
    if write_size == 0:
        return target

    # Use the last part of new_data if it's longer than the buffer
    src = new_data[-write_size:]

    # Shift existing buffer content left by write_size and append new data at the end
    if write_size < target.shape[0]:
        target[: -write_size] = target[write_size :].detach().clone()
    # Write the new samples into the tail
    target[-write_size :] = src
    return target
