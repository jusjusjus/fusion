import numpy as np
import matplotlib.pyplot as plt
from ..core import (
        poincare,
        coords,
        fieldlines as fl,
        plotting,
    )

def plot_poincare(B0=None, current=1.0):
    R0 = 2.0
    a = 1.55

    x0 = coords.toroidal_to_kartesian(R0=R0, phi=0.0, r=0.3, theta=0.0)

    line = fl.trace_fieldline(x0, B_field, length=1000.0, nsteps=1000)

    pts = poincare.compute_crossings(line, phi0=-np.pi / 8, R0=R0)
    plotting.plot_crossings(pts, is_number_points=True, is_show=False)

    theta = np.linspace(0, 2*np.pi, 25)
    plt.plot(a * np.cos(theta), a * np.sin(theta), "r--", lw=0.3, label="Coil boundary")
    amargin = 0.1
    plt.xlim(-a - amargin, a + amargin)
    plt.ylim(-a - amargin, a + amargin)
    plt.show()


def plot_fieldlines():
    R0 = 2.0

    _, ax = plotting.setup_3d_axes()

    R, THETA = np.meshgrid(
        np.linspace(0.0, 1.1, 5),
        np.linspace(0, 2*np.pi, 5, endpoint=False),
    )
    x0s = [coords.toroidal_to_kartesian(R0=R0, phi=0.0, r=r, theta=theta)
           for r, theta in zip(R.flatten(), THETA.flatten())]
    colors = [plt.cm.viridis(i / len(x0s)) for i in range(len(x0s))]

    for color, line in zip(colors, fl.trace_fieldlines(x0s, B_field, length=5.0, nsteps=500)):
        ax.plot(line[:, 0], line[:, 1], line[:, 2], color=color, alpha=0.4)

    ax.set_box_aspect([1, 1, 0.6])
    plt.show()


def B_field(x, R0=2.0, Bphi0=1.0, iota=0.3):
    X, Y, Z = x
    R = np.sqrt(X**2 + Y**2)

    eR = np.array([X/R, Y/R, 0.0])
    ephi = np.array([-Y/R, X/R, 0.0])
    ez = np.array([0.0, 0.0, 1.0])

    u = R - R0
    v = Z
    r = np.sqrt(u**2 + v**2)

    if r < 1e-12:
        etheta = ez
    else:
        theta = np.arctan2(v, u)
        etheta = -np.sin(theta) * eR + np.cos(theta) * ez

    Bphi = Bphi0 * R0 / R
    Btheta = iota * r

    return Bphi * ephi + Btheta * etheta
