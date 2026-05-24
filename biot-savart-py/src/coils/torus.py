import numpy as np
import matplotlib.pyplot as plt
from ..core import biot_savart as bs
from ..core import fieldlines as fl
from ..core import poincare
from ..core import coords
from ..core import plotting
from ..core.biot_savart import CurrentSegments


def vertical_circular_coil(phi0, R0=2.0, a=0.6, n=300, current=1.0) -> CurrentSegments:
    """
    Circular coil in a vertical plane at toroidal angle phi0.
    """
    theta = np.linspace(0, 2*np.pi, n + 1)

    eR = np.array([np.cos(phi0), np.sin(phi0), 0.0])
    ez = np.array([0.0, 0.0, 1.0])
    C = R0 * eR

    points = C[None, :] + a*np.cos(theta)[:, None]*eR[None, :] + a*np.sin(theta)[:, None]*ez[None, :]

    p0 = points[:-1]
    p1 = points[1:]

    midpoints = 0.5 * (p0 + p1)
    dl = p1 - p0

    return CurrentSegments(midpoints=midpoints, dl=dl, current=current)


def make_toroidal_coil_set(N=8, R0=2.0, a=0.6, n_per_coil=300) -> list[CurrentSegments]:
    return [
        vertical_circular_coil(2*np.pi*k/N, R0=R0, a=a, n=n_per_coil, current=1.0)
        for k in range(N)
    ]


def B_from_coils(R0: float, N: int, eps: float) -> bs.BiotSavartField:
    sources = make_toroidal_coil_set(R0=R0, N=N)
    return bs.BiotSavartField(sources=sources, eps=eps)


def plot_torus():
    field = B_from_coils(R0=2.0, N=8, eps=1e-4)

    _, ax = plotting.setup_3d_axes()
    plotting.plot_coils_3d(ax, [s.midpoints for s in field.sources])
    ax.set_title("Simple toroidal field coil set")
    plt.show()


def plot_vectorfield():
    field = B_from_coils(R0=2.0, N=8, eps=1e-4)

    _, ax = plotting.setup_3d_axes()
    plotting.plot_vectorfield_3d(
        ax, field,
        np.linspace(-3.0, 3.0, 10),
        np.linspace(-3.0, 3.0, 10),
        np.linspace(-1.0, 1.0, 10),
    )
    plotting.plot_coils_3d(ax, [s.midpoints for s in field.sources])
    ax.set_title("Magnetic field from toroidal coils")
    plt.show()


def plot_fieldlines():
    R0 = 2.0
    field = B_from_coils(R0=R0, N=8, eps=1e-4)

    _, ax = plotting.setup_3d_axes()
    plotting.plot_coils_3d(ax, [s.midpoints for s in field.sources])

    R, THETA = np.meshgrid(np.linspace(0.1, 0.5, 5), np.linspace(0, 2*np.pi, 5))
    x0s = [coords.toroidal_to_kartesian(R0=R0, phi=0.0, r=r, theta=theta)
           for r, theta in zip(R.flatten(), THETA.flatten())]

    for line in fl.trace_fieldlines(x0s, field, length=80.0, nsteps=2000):
        ax.plot(line[:, 0], line[:, 1], line[:, 2], color="red", alpha=0.4)

    plt.show()


def plot_poincare():
    R0 = 2.0
    field = B_from_coils(R0, N=8, eps=1e-4)

    x0 = coords.toroidal_to_kartesian(R0=R0, phi=0.0, r=0.15, theta=0.0)

    line = fl.trace_fieldline(x0, field, length=600.0, nsteps=40000)

    pts = poincare.compute_crossings(line, phi0=0.0, R0=2.0)
    plotting.plot_crossings(pts)


def plot_multiple_poincare_crossings():
    R0 = 2.0
    field = B_from_coils(R0, N=8, eps=1e-4)

    r0s = [0.05, 0.1, 0.15, 0.2, 0.25]
    x0s = [coords.toroidal_to_kartesian(R0=R0, phi=0.0, r=r0, theta=0.0) for r0 in r0s]

    plt.figure(figsize=(7, 7))
    for r0, line in zip(r0s, fl.trace_fieldlines(x0s, field, length=600.0, nsteps=40000)):
        pts = poincare.compute_crossings(line, phi0=0.0, R0=2.0)
        if len(pts) > 0:
            plt.plot(pts[:, 0], pts[:, 1], marker=".", linestyle="", label=f"r0={r0:.2f}")

    plt.xlabel("R")
    plt.ylabel("z")
    plt.title("Poincare plot for toroidal coil set")
    plt.legend()
    plt.show()
