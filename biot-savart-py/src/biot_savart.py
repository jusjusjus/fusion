import numpy as np


def biot_savart_segments(x, segment_midpoints, dl, current=1.0, eps=1e-9):
    """
    Magnetic field at point x from many straight current elements.

    Parameters
    ----------
    x : array, shape (3,)
        Observation point.
    segment_midpoints : array, shape (N, 3)
        Midpoints of current elements.
    dl : array, shape (N, 3)
        Directed line elements.
    current : float
        Current multiplier.
    eps : float
        Small softening parameter to avoid division by zero.

    Returns
    -------
    B : array, shape (3,)
    """
    x = np.asarray(x)
    r = x[None, :] - segment_midpoints
    r2 = np.sum(r**2, axis=1) + eps**2
    r3 = r2 ** 1.5

    dB = current * np.cross(dl, r) / r3[:, None]
    return np.sum(dB, axis=0)


def make_B_from_segments(all_midpoints,
                         all_dl,
                         all_currents,
                         eps=1e-4):

    def B(x):
        x = np.asarray(x, dtype=float)
        out = np.zeros(3)
        for mid, dl, I in zip(all_midpoints, all_dl, all_currents):
            out += biot_savart_segments(x, mid, dl, current=I, eps=eps)

        return out

    return B

