import numpy as np

def kartesian_to_toroidal(x, R0=2.0):
    x = np.asarray(x)
    X, Y, Z = x

    phi = np.arctan2(Y, X)
    R = np.sqrt(X**2 + Y**2)

    u = R - R0
    v = Z

    r = np.sqrt(u**2 + v**2)
    theta = np.arctan2(v, u)

    return R, phi, r, theta


def toroidal_to_kartesian(R0, phi, r, theta):
    R = R0 + r*np.cos(theta)
    z = r*np.sin(theta)

    x = R*np.cos(phi)
    y = R*np.sin(phi)

    return np.array([x, y, z])
