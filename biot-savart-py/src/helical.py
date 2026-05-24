import numpy as np
import matplotlib.pyplot as plt

from . import (
    biot_savart as bs,
    coords,
    fieldlines as fl,
    poincare,
    plotting,
    printing,
)

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
    mids = [H1[0], H2[0]]
    dl = [H1[1], H2[1]]
    current = [H1[2], H2[2]]

    magnetic_field_fn = bs.make_B_from_segments(mids, dl, current, eps=eps)
    if B0 is not None:
        magnetic_field_fn = make_combined_B(magnetic_field_fn, B0=B0, R0=R0)

    return mids, dl, current, magnetic_field_fn


def helical_toroidal_coil(R0=2.0, a=0.5, nfp=3, phase=0.0, n=1200, current=1.0):
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
    coil : Coil
        A Coil object representing the helical toroidal coil.
    """
    print("Creating Helicon")
    points = _helical_coil(R0, a, nfp, phase, n, current)
    p0 = points[:-1]
    p1 = points[1:]

    midpoints = 0.5 * (p0 + p1)
    dl = p1 - p0

    return midpoints, dl, current


def B_from_coil(R0=2.0, a=0.5, nfp=3, phase=0.0, n=1200, current=1.0, eps=1e-4):
    midpoints, dl, current = helical_toroidal_coil(R0, a, nfp, phase, n, current)
    B = bs.make_B_from_segments([midpoints], [dl], [current], eps=eps)
    return B


def plot_helical_coil():
    points, _, _ = helical_toroidal_coil(nfp=5)

    _, ax = plotting.setup_3d_axes()
    ax.plot(points[:, 0], points[:, 1], points[:, 2])
    plt.show()


def plot_vectorfield():
    eps = 1e-4
    mids, dl, current = helical_toroidal_coil(nfp=5)
    mids = [mids]

    B_toroidal_coils = bs.make_B_from_segments(mids, [dl], [current], eps=eps)

    x = np.linspace(-3.2, 3.0, 7)
    y = np.linspace(-3.2, 3.0, 7)
    z = np.linspace(-1.2, 1.0, 7)

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


def plot_fieldlines(B0=None):
    R0 = 2.0
    mids, dl, current, B_toroidal_coils = double_torus_w_B(
        R0=R0,
        a=1.0,
        nfp=8,
        n=1500,
    )

    _, ax = plotting.setup_3d_axes()
    plotting.plot_coils_3d(ax, mids)

    R, THETA = np.meshgrid(
        np.linspace(0.0, 1.1, 1),
        np.linspace(0, 2*np.pi, 1, endpoint=False),
    )

    for i, (r, theta) in enumerate(zip(R.flatten(), THETA.flatten())):
        X = coords.toroidal_to_kartesian(R0=R0, phi=0.0, r=r, theta=theta)
        print(f"Tracing field line from {X}")
        line = fl.trace_fieldline(X, B_toroidal_coils, length=30.0, nsteps=2000)
        color = plt.cm.viridis(i / len(R.flatten()))
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
    mids, dl, current, B_total = double_torus_w_B(
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


def make_combined_B(B_coils, B0=1.0, R0=2.0):
    def combined(x):
        return B_toroidal_background(x, B0=B0, R0=R0) + B_coils(x)

    return combined


def B_toroidal_background(x, B0=1.0, R0=2.0):
    X, Y, Z = x
    R = np.sqrt(X**2 + Y**2)

    if R < 1e-9:
        return np.zeros(3)

    ephi = np.array([Y, -X, .0])

    return B0 * ephi / R ** 2.0
