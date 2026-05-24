import numpy as np
import matplotlib.pyplot as plt
from dataclasses import dataclass

from ..core import (
    biot_savart as bs,
    coords,
    fieldlines as fl,
    poincare,
    plotting,
    printing,
)
from ..core.biot_savart import CurrentSegments


@dataclass
class CombinedField:
    """Toroidal background field superimposed with a Biot-Savart coil field."""

    coil_field: bs.BiotSavartField
    B0: float = 1.0
    R0: float = 2.0

    def __call__(self, x):
        return B_toroidal_background(x, B0=self.B0, R0=self.R0) + self.coil_field(x)


def double_torus_w_B(R0=2.0, a=0.5, nfp=3, n=1200, current=1.0, B0=1.0, eps=1e-4):
    params = {
        "R0": R0,
        "a": a,
        "nfp": nfp,
        "n": n,
        "current": current,
    }
    H1 = helical_toroidal_coil(**params, phase=0.0)
    H2 = helical_toroidal_coil(**params, phase=np.pi)
    sources = [H1, H2]

    coil_field = bs.BiotSavartField(sources=sources, eps=eps)
    magnetic_field_fn = CombinedField(coil_field=coil_field, B0=B0, R0=R0) if B0 is not None else coil_field

    return sources, magnetic_field_fn


def helical_toroidal_coil(R0=2.0, a=0.5, nfp=3, phase=0.0, n=1200, current=1.0) -> CurrentSegments:
    """
    Generate a helical toroidal coil.

    Parameters
    ----------
    R0 : float
        Major radius of the torus.
    a : float
        Minor radius of the torus.
    nfp : int
        Number of field periods.
    phase : float
        Phase shift in radians.
    n : int
        Number of points to generate along the coil.
    current : float
        Current in the coil.

    Returns
    -------
    coil : CurrentSegments
        A CurrentSegments object representing the helical toroidal coil.
    """
    print("Creating Helicon")
    points = _helical_coil(R0, a, nfp, phase, n, current)
    p0 = points[:-1]
    p1 = points[1:]

    midpoints = 0.5 * (p0 + p1)
    dl = p1 - p0

    return CurrentSegments(midpoints=midpoints, dl=dl, current=current)


def B_from_coil(R0=2.0, a=0.5, nfp=3, phase=0.0, n=1200, current=1.0, eps=1e-4) -> bs.BiotSavartField:
    source = helical_toroidal_coil(R0, a, nfp, phase, n, current)
    return bs.BiotSavartField(sources=[source], eps=eps)


def plot_helical_coil():
    source = helical_toroidal_coil(nfp=5)

    _, ax = plotting.setup_3d_axes()
    ax.plot(source.midpoints[:, 0], source.midpoints[:, 1], source.midpoints[:, 2])
    plt.show()


def plot_vectorfield():
    eps = 1e-4
    source = helical_toroidal_coil(nfp=5)

    B_toroidal_coils = bs.BiotSavartField(sources=[source], eps=eps)

    _, ax = plotting.setup_3d_axes()
    plotting.plot_vectorfield_3d(
        ax, B_toroidal_coils,
        np.linspace(-3.2, 3.0, 7),
        np.linspace(-3.2, 3.0, 7),
        np.linspace(-1.2, 1.0, 7),
    )
    plotting.plot_coils_3d(ax, [source.midpoints])
    ax.set_title("Magnetic field from toroidal coils")
    plt.show()


def plot_fieldlines(B0=None):
    R0 = 2.0
    sources, B_toroidal_coils = double_torus_w_B(
        R0=R0,
        a=1.0,
        nfp=8,
        n=1500,
    )

    _, ax = plotting.setup_3d_axes()
    plotting.plot_coils_3d(ax, [s.midpoints for s in sources])

    R, THETA = np.meshgrid(
        np.linspace(0.0, 1.1, 1),
        np.linspace(0, 2*np.pi, 1, endpoint=False),
    )
    x0s = [coords.toroidal_to_kartesian(R0=R0, phi=0.0, r=r, theta=theta)
           for r, theta in zip(R.flatten(), THETA.flatten())]
    colors = [plt.cm.viridis(i / len(x0s)) for i in range(len(x0s))]

    for color, line in zip(colors, fl.trace_fieldlines(x0s, B_toroidal_coils, length=30.0, nsteps=2000)):
        ax.plot(line[:, 0], line[:, 1], line[:, 2], color=color, alpha=0.4)

    plt.show()


def _helical_coil(R0=1.0, a=0.5, nfp=3, phase=0.0, n=1200, current=1.0):
    printing.print_dict({
        "R0": R0,
        "a": a,
        "nfp": nfp,
        "phase": phase,
        "n": n,
    })

    phi = np.linspace(0, 2 * np.pi, n + 1, endpoint=True)

    angle = nfp * phi + phase

    R = R0 + a * np.cos(angle)
    z = a * np.sin(angle)

    x = R * np.cos(phi)
    y = R * np.sin(phi)

    return np.column_stack([x, y, z])


def plot_poincare(B0=None, current=1.0):
    R0 = 2.0
    a = 1.55
    sources, B_total = double_torus_w_B(
        R0=R0,
        a=a,
        nfp=5,
        n=1200,
        current=current,
    )

    x0 = coords.toroidal_to_kartesian(R0=R0, phi=0.0, r=0.0, theta=0.0)

    line = fl.trace_fieldline(x0, B_total, length=400.0, nsteps=10000)

    pts = poincare.compute_crossings(line, phi0=-np.pi / 8, R0=R0)
    plotting.plot_crossings(pts, is_number_points=True, is_show=False)

    theta = np.linspace(0, 2*np.pi, 25)
    plt.plot(a * np.cos(theta), a * np.sin(theta), "r--", lw=0.3, label="Coil boundary")
    amargin = 0.1
    plt.xlim(-a - amargin, a + amargin)
    plt.ylim(-a - amargin, a + amargin)
    plt.show()


def B_toroidal_background(x, B0=1.0, R0=2.0):
    X, Y, Z = x
    R = np.sqrt(X**2 + Y**2)

    if R < 1e-9:
        return np.zeros(3)

    ephi = np.array([Y, -X, .0])

    return B0 * ephi / R ** 2.0
