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


def plot_fieldline_surface(r=0.5, R0=2.0, n_lines=40, n_turns=3, nsteps=1500):
    """
    Visualise a magnetic flux surface by tracing field lines from a full
    poloidal ring and assembling them into a 3D surface mesh.

    Starting points are distributed uniformly in poloidal angle at minor
    radius *r*.  After tracing, adjacent lines are connected into a
    ``plot_surface`` mesh whose helical banding directly reveals the
    rotational transform (iota) of the toy field.

    Parameters
    ----------
    r : float
        Minor radius of the starting ring.
    R0 : float
        Major radius of the torus.
    n_lines : int
        Number of field lines (poloidal resolution of the surface).
    n_turns : int
        Number of toroidal turns each field line is traced for.
    nsteps : int
        Integration steps per field line.
    """
    length = n_turns * 2 * np.pi * R0
    theta_vals = np.linspace(0, 2 * np.pi, n_lines, endpoint=False)
    x0s = [
        coords.toroidal_to_kartesian(R0=R0, phi=0.0, r=r, theta=theta)
        for theta in theta_vals
    ]

    lines = fl.trace_fieldlines(x0s, B_field, length=length, nsteps=nsteps)

    # Resample every line to exactly n_pts points so we can form a regular grid
    n_pts = nsteps + 1
    t_uniform = np.linspace(0.0, 1.0, n_pts)

    def _resample(line):
        t_src = np.linspace(0.0, 1.0, len(line))
        return np.column_stack([np.interp(t_uniform, t_src, line[:, i]) for i in range(3)])

    resampled = [_resample(l) for l in lines]

    # Build (n_lines+1, n_pts) surface arrays; +1 closes the poloidal ring
    X = np.array([l[:, 0] for l in resampled])
    Y = np.array([l[:, 1] for l in resampled])
    Z = np.array([l[:, 2] for l in resampled])
    X = np.vstack([X, X[[0]]])
    Y = np.vstack([Y, Y[[0]]])
    Z = np.vstack([Z, Z[[0]]])

    # Show ~15 arc-length slices per turn so the helical bands are visible
    cstride = max(1, n_pts // (n_turns * 15))

    fig, ax = plotting.setup_3d_axes()
    ax.plot_surface(
        X, Y, Z,
        rstride=1, cstride=cstride,
        alpha=0.55,
        cmap="viridis",
        linewidth=0.3,
        edgecolors="grey",
    )
    ax.set_title(f"Flux surface  r = {r:.2f},  iota ≈ 0.3,  {n_turns} toroidal turns")
    plt.show()


def plot_evolving_sheet(
    r_min=0.1,
    r_max=0.8,
    n_lines=30,
    theta0=0.0,
    phi0=0.0,
    R0=2.0,
    n_turns=1,
    nsteps=800,
    n_snapshots=6,
):
    """
    Visualise how a radial line of initial conditions evolves into a helical sheet.

    Each point on the line r ∈ [r_min, r_max] (at fixed poloidal angle theta0 and
    toroidal angle phi0) is advected along its magnetic field line.  Because the
    rotational transform grows with r (poloidal field ∝ iota·r), the initially
    straight radial line shears and twists into a helical sheet.

    The surface is assembled from the field-line trajectories and rendered with
    ``plot_surface``.  Cross-sections at ``n_snapshots`` evenly-spaced arc-length
    values are overlaid as coloured curves to show the line at each "moment".

    Parameters
    ----------
    r_min, r_max : float
        Minor-radius range of the initial line.
    n_lines : int
        Number of field lines (radial resolution of the surface).
    theta0 : float
        Initial poloidal angle of every starting point.
    phi0 : float
        Toroidal angle of the initial line.
    R0 : float
        Major radius.
    n_turns : int
        Number of toroidal turns to trace.
    nsteps : int
        Integration steps per field line.
    n_snapshots : int
        Number of cross-section curves to overlay.
    """
    length = n_turns * 2 * np.pi * R0
    r_vals = np.linspace(r_min, r_max, n_lines)
    x0s = [
        coords.toroidal_to_kartesian(R0=R0, phi=phi0, r=r, theta=theta0)
        for r in r_vals
    ]

    lines = fl.trace_fieldlines(
        x0s,
        B_field,
        length=length,
        nsteps=nsteps,
    )

    # Resample every line to exactly n_pts points
    n_pts = nsteps + 1
    t_uniform = np.linspace(0.0, 1.0, n_pts)

    def _resample(line):
        t_src = np.linspace(0.0, 1.0, len(line))
        return np.column_stack([np.interp(t_uniform, t_src, line[:, i]) for i in range(3)])

    resampled = [_resample(l) for l in lines]

    # Surface arrays: shape (n_lines, n_pts)
    X = np.array([l[:, 0] for l in resampled])
    Y = np.array([l[:, 1] for l in resampled])
    Z = np.array([l[:, 2] for l in resampled])

    fig, ax = plotting.setup_3d_axes()

    # Surface — rstride=1 keeps full radial resolution; cstride shows helical banding
    cstride = max(1, n_pts // int(n_turns * 20))
    ax.plot_surface(
        X, Y, Z,
        rstride=2,
        cstride=cstride,
        alpha=0.35,
        cmap="Blues",
        linewidth=0.0,
    )

    # Snapshot cross-sections: the line at discrete arc-length values
    snap_indices = np.linspace(0, n_pts - 1, n_snapshots, dtype=int)
    for k, j in enumerate(snap_indices):
        color = plt.cm.plasma(k / max(n_snapshots - 1, 1))
        ax.plot(X[:, j], Y[:, j], Z[:, j], color=color, lw=1.5, alpha=0.9)

    # Label initial and final snapshot
    ax.plot(X[:, 0], Y[:, 0], Z[:, 0], "w-", lw=2.0, label="s = 0 (initial line)")
    ax.plot(X[:, -1], Y[:, -1], Z[:, -1], "r-", lw=2.0, label=f"s = L ({n_turns} turns)")
    ax.legend(fontsize=8, loc="upper left")
    ax.set_title(
        f"Helical sheet:  r ∈ [{r_min}, {r_max}],  θ₀ = {theta0:.2f},  "
        f"iota ≈ 0.3,  {n_turns} turn(s)"
    )
    plt.show()


def B_field(x, R0=2.0, Bphi0=1.0, iota=0.7):
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
