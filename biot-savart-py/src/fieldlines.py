import numpy as np
from scipy.integrate import solve_ivp


def _fieldline_rhs(s, x, B_func, min_B=1e-12):
    B = B_func(x)
    B_mag = np.linalg.norm(B)
    if B_mag < min_B:
        return np.zeros_like(x)

    return B / B_mag


def trace_fieldline(x0, B_func, length=20.0, nsteps=2000):
    """
    Trace a magnetic field line by arc-length integration.

    Parameters
    ----------
    x0 : array, shape (3,)
        Starting point.
    B_func : callable
        Returns B(x), shape (3,).
    length : float
        Total arc length to integrate.
    nsteps : int
        Maximum number of integration steps.

    Returns
    -------
    line : array, shape (M, 3)
    """
    sol = solve_ivp(
        lambda s, x: _fieldline_rhs(s, x, B_func),
        [0, length],
        x0,
        method='RK45',
        max_step=length / nsteps,
    )
    return sol.y.T
