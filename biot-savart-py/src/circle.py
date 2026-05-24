import numpy as np
import matplotlib.pyplot as plt
from . import biot_savart as bs
from . import fieldlines as fl
from . import plotting

def circular_loop(radius, z, n, current):
    """
    Discretized circular loop
    """
    phi = np.linspace(0, 2 * np.pi, n, endpoint=False)
    x = radius * np.cos(phi)
    y = radius * np.sin(phi)
    z = np.full_like(x, z)
    points = np.column_stack([x, y, z])

    p0 = points[:-1]
    p1 = points[1:]

    midpoints = 0.5 * (p0 + p1)
    dl = p1 - p0

    return midpoints, dl, current


def compare_symmetry_with_analytics():
    a = 1.0
    loop_mid, loop_dl, I = circular_loop(radius=a, z=0.0, n=400, current=1.0)

    def B_from_loop(x):
        return bs.biot_savart_segments(x, loop_mid, loop_dl, current=I)

    zs = np.linspace(-3, 3, 200)
    Bz_num = []

    for z in zs:
        B = B_from_loop(np.array([0.0, 0.0, z]))
        Bz_num.append(B[2])

    Bz_num = np.array(Bz_num)

    Bz_analytic_shape = 2 * np.pi * a**2 / (a**2 + zs**2)**1.5

    plt.plot(zs, Bz_num, label="numerical")
    plt.plot(zs, Bz_analytic_shape, "--", label="analytic shape")
    plt.xlabel("z")
    plt.ylabel("Bz, arbitrary units")
    plt.legend()
    plt.grid()
    plt.show()


def plot_field():
    midpoints, dl, current = circular_loop(radius=1, z=0, n=100, current=0.1)
    _, ax = plotting.setup_3d_axes()
    ax.plot(midpoints[:, 0], midpoints[:, 1], midpoints[:, 2], label='Circular Loop')

    grid = np.meshgrid(
        np.linspace(-2.5, 2.5, 11),
        np.linspace(-2.5, 2.5, 11),
        np.linspace(-2.5, 2.5, 11),
    )
    for x in zip(*[g.flatten() for g in grid]):
        B = bs.biot_savart_segments(x, midpoints, dl, current=current)
        ax.quiver(*x, *B, color='r', label='Magnetic Field at Observation Point')

    plt.xlim(-2, 2)
    plt.ylim(-2, 2)
    ax.set_zlim(-2, 2)
    plt.show()


def plot_vertical_2d_slice():
    a = 1.0
    loop_mid, loop_dl, I = circular_loop(radius=a, z=0.0, n=400, current=1.0)

    def B_from_loop(x):
        x = np.asarray(x)
        return bs.biot_savart_segments(x, loop_mid, loop_dl, current=I)

    nx, nz = 100, 100
    xs = a * np.linspace(-2, 2, nx)
    zs = a * np.linspace(-2, 2, nz)
    X, Z = np.meshgrid(xs, zs)

    Bx = np.zeros_like(X)
    Bz = np.zeros_like(Z)

    for i in range(nz):
        for j in range(nx):
            B = B_from_loop([X[i, j], 0.0, Z[i, j]])
            Bx[i, j] = B[0]
            Bz[i, j] = B[2]

    plt.figure(figsize=(6, 6))
    plt.streamplot(X, Z, Bx, Bz, density=1.0)

    Bmag = np.sqrt(Bx**2 + Bz**2)
    plt.contourf(
        X, Z, np.log10(Bmag),
        levels=int(np.round(np.log10(Bmag.max()))),
        cmap='viridis',
        alpha=0.6,
    )
    print(f"B magnitude range: {Bmag.min():.2e} to {Bmag.max():.2e}")

    plt.scatter([a, -a], [0, 0], color='black', s=20, label="coil cross-section")
    plt.xlabel("x")
    plt.ylabel("z")
    plt.axis('equal')
    plt.title('Field slice through circular loop')
    plt.grid()
    plt.legend()
    plt.show()

def plot_bz_along_axis():
    a = 10.0
    loop_mid, loop_dl, I = circular_loop(radius=a, z=0.0, n=400, current=1.0)

    def B_from_loop(x):
        return bs.biot_savart_segments(x, loop_mid, loop_dl, current=I)

    xs = a * np.linspace(-3, 3, 200)
    Bz_num = []

    for x in xs:
        B = B_from_loop(np.array([x, 0.0, 0.5]))
        Bz_num.append(B[2])

    plt.plot(xs, Bz_num, label="numerical")
    plt.xlabel("x")
    plt.ylabel("Bz, arbitrary units")
    plt.legend()
    plt.grid()
    plt.show()


def plot_bmag_along_axis():
    a = 10.0
    loop_mid, loop_dl, I = circular_loop(radius=a, z=0.0, n=400, current=1.0)

    def B_from_loop(x):
        return bs.biot_savart_segments(x, loop_mid, loop_dl, current=I)

    xs = a * np.linspace(-3, 3, 200)
    Bmag_num = []

    for x in xs:
        B = B_from_loop(np.array([x, 0.0, 0.5]))
        Bmag_num.append(np.linalg.norm(B))

    plt.plot(xs, Bmag_num, label="numerical")
    plt.xlabel("x")
    plt.ylabel("|B|, arbitrary units")
    plt.legend()
    plt.grid()
    plt.show()


def plot_fieldline():
    a = 1.0
    loop_mid, loop_dl, I = circular_loop(radius=a, z=0.0, n=400, current=1.0)

    def B_from_loop(x):
        return bs.biot_savart_segments(x, loop_mid, loop_dl, current=I)

    x0 = np.array([0.5, 0.0, 0.5])
    fieldline = fl.trace_fieldline(x0, B_from_loop)

    _, ax = plotting.setup_3d_axes()
    ax.plot(fieldline[:, 0], fieldline[:, 1], fieldline[:, 2], label='Field Line')
    ax.plot(loop_mid[:, 0], loop_mid[:, 1], loop_mid[:, 2], label='Circular Loop')
    plt.legend()
    plt.show()

