import numpy as np
import matplotlib.pyplot as plt


def setup_3d_axes(figsize=(7, 7), box_aspect=(1, 1, 0.6)):
    """Create a figure with a 3-D axes and standard labels."""
    fig = plt.figure(figsize=figsize)
    ax = fig.add_subplot(111, projection="3d")
    ax.set_xlabel("x")
    ax.set_ylabel("y")
    ax.set_zlabel("z")
    ax.set_box_aspect(box_aspect)
    return fig, ax


def plot_coils_3d(ax, mids, color="black", alpha=0.8):
    """Draw a list of coil midpoint arrays on a 3-D axes."""
    for mid in mids:
        ax.plot(mid[:, 0], mid[:, 1], mid[:, 2], color=color, alpha=alpha)


def eval_vectorfield(B_func, x_vals, y_vals, z_vals):
    """
    Evaluate a vector field on a 3-D Cartesian grid.

    Parameters
    ----------
    B_func : callable
        Maps a point (3,) to a vector (3,).
    x_vals, y_vals, z_vals : 1-D arrays
        Grid coordinates along each axis.

    Returns
    -------
    X, Y, Z : arrays, shape (ny, nx, nz)
        Meshgrid coordinate arrays.
    Bx, By, Bz : arrays, same shape
        Field components at each grid point.
    """
    X, Y, Z = np.meshgrid(x_vals, y_vals, z_vals)
    pts = np.column_stack([X.ravel(), Y.ravel(), Z.ravel()])
    B = np.array([B_func(p) for p in pts])
    shape = X.shape
    return X, Y, Z, B[:, 0].reshape(shape), B[:, 1].reshape(shape), B[:, 2].reshape(shape)


def plot_vectorfield_3d(ax, B_func, x_vals, y_vals, z_vals, **quiver_kw):
    """
    Quiver-plot a vector field on a 3-D Cartesian grid.

    Parameters
    ----------
    ax : Axes3D
    B_func : callable
        Maps a point (3,) to a vector (3,).
    x_vals, y_vals, z_vals : 1-D arrays
        Grid coordinates along each axis.
    **quiver_kw
        Forwarded to ax.quiver (defaults: length=0.1, normalize=True).
    """
    quiver_kw.setdefault("length", 0.1)
    quiver_kw.setdefault("normalize", True)
    X, Y, Z, Bx, By, Bz = eval_vectorfield(B_func, x_vals, y_vals, z_vals)
    ax.quiver(X, Y, Z, Bx, By, Bz, **quiver_kw)


def plot_crossings(pts, is_number_points=False, is_show=True, title="Poincaré section"):
    """
    Plot Poincaré crossings in (R-R0, z) coordinates.

    Parameters
    ----------
    pts : array, shape (N, 2)
        Crossing points returned by poincare.compute_crossings.
    is_number_points : bool
        Annotate each point with its index.
    is_show : bool
        Call plt.show() at the end.
    title : str
        Axes title.
    """
    plt.figure(figsize=(6, 6))
    plt.plot(pts[:, 0], pts[:, 1], "o", markersize=2)
    if is_number_points:
        for i, (x, y) in enumerate(pts):
            plt.text(x, y, str(i), fontsize=6)

    plt.xlabel("R - R0")
    plt.ylabel("z")
    plt.axis("equal")
    plt.grid()
    plt.title(title)
    if is_show:
        plt.show()
