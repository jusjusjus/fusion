import numpy as np
import matplotlib.pyplot as plt
from . import biot_savart as bs
from . import fieldlines as fl
from . import poincare
from . import coords
from . import plotting

def vertical_circular_coil(phi0, R0=2.0, a=0.6, n=300, current=1.0):
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

    return midpoints, dl, current


def make_toroidal_coil_set(N=8, R0=2.0, a=0.6, n_per_coil=300):
    mids = []
    dls = []
    currents = []

    for k in range(N):
        phi = 2*np.pi*k/N
        mid, dl, I = vertical_circular_coil(
            phi,
            R0=R0,
            a=a,
            n=n_per_coil,
            current=1.0,
        )
        mids.append(mid)
        dls.append(dl)
        currents.append(I)

    return mids, dls, currents


def B_from_coils(R0: float, N: int, eps: float):
    mids, dls, currents = make_toroidal_coil_set(R0=R0, N=N)
    B_toroidal_coils = bs.make_B_from_segments(mids, dls, currents, eps=eps)
    return B_toroidal_coils


def plot_torus():
    B_toroidal_coils = B_from_coils(R0=2.0, N=8, eps=1e-4)

    _, ax = plotting.setup_3d_axes()
    plotting.plot_coils_3d(ax, mids)
    ax.set_title("Simple toroidal field coil set")
    plt.show()


def plot_vectorfield():
    B_toroidal_coils = B_from_coils(R0=2.0, N=8, eps=1e-4)

    x = np.linspace(-3.0, 3.0, 10)
    y = np.linspace(-3.0, 3.0, 10)
    z = np.linspace(-1.0, 1.0, 10)

    X, Y, Z = np.meshgrid(x, y, z)

    Bx = np.zeros_like(X)
    By = np.zeros_like(X)
    Bz = np.zeros_like(X)

    for i in range(X.shape[0]):
        for j in range(X.shape[1]):
            for k in range(X.shape[2]):
                B = B_toroidal_coils([X[i, j, k], Y[i, j, k], Z[i, j, k]])
                Bx[i, j, k] = B[0]
                By[i, j, k] = B[1]
                Bz[i, j, k] = B[2]

    _, ax = plotting.setup_3d_axes()
    ax.quiver(X, Y, Z, Bx, By, Bz, length=0.1, normalize=True)
    plotting.plot_coils_3d(ax, mids)
    ax.set_title("Magnetic field from toroidal coils")
    plt.show()


def plot_fieldlines():
    R0 = 2.0
    B_toroidal_coils = B_from_coils(R0=R0, N=8, eps=1e-4)

    _, ax = plotting.setup_3d_axes()
    plotting.plot_coils_3d(ax, mids)

    R, THETA = np.meshgrid(np.linspace(0.1, 0.5, 5), np.linspace(0, 2*np.pi, 5))

    for r, theta in zip(R.flatten(), THETA.flatten()):
        X = coords.toroidal_to_kartesian(R0=R0, phi=0.0, r=r, theta=theta)
        print(f"Tracing field line from {X}")
        line = fl.trace_fieldline(X, B_toroidal_coils, length=80.0, nsteps=2000)
        ax.plot(line[:, 0], line[:, 1], line[:, 2], color="red", alpha=0.4)

    plt.show()


def plot_poincare():
    R0 = 2.0
    B_toroidal_coils = B_from_coils(R0, N=8, eps=1e-4)

    x0 = coords.toroidal_to_kartesian(R0=R0, phi=0.0, r=0.15, theta=0.0)

    line = fl.trace_fieldline(x0, B_toroidal_coils, length=600.0, nsteps=40000)

    pts = poincare.compute_crossings(line, phi0=0.0, R0=2.0)
    plotting.plot_crossings(pts)


def plot_multiple_poincare_crossings():
    R0 = 2.0
    B_toroidal_coils = B_from_coils(R0, N=8, eps=1e-4)
    plt.figure(figsize=(7, 7))
    for r0 in [0.05, 0.1, 0.15, 0.2, 0.25]:
        print(f"Tracing field line from r0={r0:.2f}")
        x0 = coords.toroidal_to_kartesian(R0=R0, phi=0.0, r=r0, theta=0.0)
        line = fl.trace_fieldline(x0, B_toroidal_coils, length=600.0, nsteps=40000)
        pts = poincare.compute_crossings(line, phi0=0.0, R0=2.0)
        if len(pts) > 0:
            plt.plot(pts[:, 0], pts[:, 1], marker=".", linestyle="", label=f"r0={r0:.2f}")

    plt.xlabel("R")
    plt.ylabel("z")
    plt.title("Poincare plot for toroidal coil set")
    plt.legend()
    plt.show()
