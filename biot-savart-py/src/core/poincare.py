import numpy as np


def compute_crossings(line, phi0=0.0, R0=2.0):
    """
    Extract approximate intersections with plane phi = phi0 mod 2pi.

    Returns points in (R-R0, z) coordinates.
    """
    x = line[:, 0]
    y = line[:, 1]
    z = line[:, 2]

    phi = np.unwrap(np.arctan2(y, x))
    if phi[-1] < phi[0]:
        phi *= -1.0

    m_values = np.floor((phi - phi0) / (2*np.pi)).astype(int)

    crossings = []

    for i in range(len(line) - 1):
        m0 = m_values[i]
        m1 = m_values[i + 1]

        if m1 != m0:
            target = phi0 + 2*np.pi*m1

            # Linear interpolation in phi
            denom = phi[i + 1] - phi[i]
            if abs(denom) < 1e-12:
                continue

            t = (target - phi[i]) / denom

            if 0.0 <= t <= 1.0:
                p = line[i] + t * (line[i + 1] - line[i])

                R = np.sqrt(p[0]**2 + p[1]**2)
                crossings.append([R - R0, p[2]])

    return np.array(crossings)
