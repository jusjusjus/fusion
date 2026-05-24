import numpy as np
from concurrent.futures import ProcessPoolExecutor
from scipy.integrate import solve_ivp

try:
    from numba import njit as _njit
    _NUMBA_AVAILABLE = True
except ImportError:
    _NUMBA_AVAILABLE = False


# ---------------------------------------------------------------------------
# Numba kernels (compiled only when numba is available)
# ---------------------------------------------------------------------------

if _NUMBA_AVAILABLE:
    @_njit(cache=True)
    def _biot_savart_njit(x, midpoints, weighted_dl, eps):
        """Biot-Savart sum over segments; weighted_dl = dl * current."""
        B = np.zeros(3)
        for i in range(midpoints.shape[0]):
            r0 = x[0] - midpoints[i, 0]
            r1 = x[1] - midpoints[i, 1]
            r2 = x[2] - midpoints[i, 2]
            r2sq = r0*r0 + r1*r1 + r2*r2 + eps*eps
            r3 = r2sq ** 1.5
            B[0] += (weighted_dl[i, 1]*r2 - weighted_dl[i, 2]*r1) / r3
            B[1] += (weighted_dl[i, 2]*r0 - weighted_dl[i, 0]*r2) / r3
            B[2] += (weighted_dl[i, 0]*r1 - weighted_dl[i, 1]*r0) / r3
        return B

    @_njit(cache=True)
    def _toroidal_bg_njit(x, B0, R0):
        """Toroidal background field B0 / R in the phi-hat direction."""
        X, Y = x[0], x[1]
        R = np.sqrt(X*X + Y*Y)
        B = np.zeros(3)
        if R < 1e-9:
            return B
        B[0] = B0 * Y / (R * R)
        B[1] = -B0 * X / (R * R)
        return B

    @_njit(cache=True)
    def _rk4_trace_bs(x0, midpoints, weighted_dl, eps, length, nsteps):
        """Fixed-step RK4 along normalized B for a pure Biot-Savart field."""
        dt = length / nsteps
        traj = np.empty((nsteps + 1, 3))
        x = x0.copy()
        traj[0] = x
        for i in range(nsteps):
            B1 = _biot_savart_njit(x, midpoints, weighted_dl, eps)
            n1 = np.sqrt(B1[0]**2 + B1[1]**2 + B1[2]**2)
            if n1 < 1e-12:
                for j in range(i + 1, nsteps + 1):
                    traj[j] = x
                return traj
            k1 = B1 / n1

            B2 = _biot_savart_njit(x + 0.5*dt*k1, midpoints, weighted_dl, eps)
            n2 = np.sqrt(B2[0]**2 + B2[1]**2 + B2[2]**2)
            k2 = B2 / (n2 + 1e-30)

            B3 = _biot_savart_njit(x + 0.5*dt*k2, midpoints, weighted_dl, eps)
            n3 = np.sqrt(B3[0]**2 + B3[1]**2 + B3[2]**2)
            k3 = B3 / (n3 + 1e-30)

            B4 = _biot_savart_njit(x + dt*k3, midpoints, weighted_dl, eps)
            n4 = np.sqrt(B4[0]**2 + B4[1]**2 + B4[2]**2)
            k4 = B4 / (n4 + 1e-30)

            x = x + (dt / 6.0) * (k1 + 2.0*k2 + 2.0*k3 + k4)
            traj[i + 1] = x
        return traj

    @_njit(cache=True)
    def _rk4_trace_combined(x0, midpoints, weighted_dl, eps, B0, R0, length, nsteps):
        """Fixed-step RK4 for a Biot-Savart field superimposed with a toroidal background."""
        dt = length / nsteps
        traj = np.empty((nsteps + 1, 3))
        x = x0.copy()
        traj[0] = x
        for i in range(nsteps):
            Bc1 = _biot_savart_njit(x, midpoints, weighted_dl, eps)
            Bt1 = _toroidal_bg_njit(x, B0, R0)
            B1 = Bc1 + Bt1
            n1 = np.sqrt(B1[0]**2 + B1[1]**2 + B1[2]**2)
            if n1 < 1e-12:
                for j in range(i + 1, nsteps + 1):
                    traj[j] = x
                return traj
            k1 = B1 / n1

            xk2 = x + 0.5*dt*k1
            Bc2 = _biot_savart_njit(xk2, midpoints, weighted_dl, eps)
            Bt2 = _toroidal_bg_njit(xk2, B0, R0)
            B2 = Bc2 + Bt2
            n2 = np.sqrt(B2[0]**2 + B2[1]**2 + B2[2]**2)
            k2 = B2 / (n2 + 1e-30)

            xk3 = x + 0.5*dt*k2
            Bc3 = _biot_savart_njit(xk3, midpoints, weighted_dl, eps)
            Bt3 = _toroidal_bg_njit(xk3, B0, R0)
            B3 = Bc3 + Bt3
            n3 = np.sqrt(B3[0]**2 + B3[1]**2 + B3[2]**2)
            k3 = B3 / (n3 + 1e-30)

            xk4 = x + dt*k3
            Bc4 = _biot_savart_njit(xk4, midpoints, weighted_dl, eps)
            Bt4 = _toroidal_bg_njit(xk4, B0, R0)
            B4 = Bc4 + Bt4
            n4 = np.sqrt(B4[0]**2 + B4[1]**2 + B4[2]**2)
            k4 = B4 / (n4 + 1e-30)

            x = x + (dt / 6.0) * (k1 + 2.0*k2 + 2.0*k3 + k4)
            traj[i + 1] = x
        return traj


# ---------------------------------------------------------------------------
# Public integration API
# ---------------------------------------------------------------------------

def _fieldline_rhs(s, x, B_func, min_B=1e-12):
    B = B_func(x)
    B_mag = np.linalg.norm(B)
    if B_mag < min_B:
        return np.zeros_like(x)

    return B / B_mag


def trace_fieldline(x0, B_func, length=20.0, nsteps=2000):
    """
    Trace a magnetic field line by arc-length integration.

    If *B_func* has been compiled with ``.compile()`` and numba is installed,
    uses a fast fixed-step RK4 (50–100× faster than solve_ivp).
    Otherwise falls back to ``scipy.integrate.solve_ivp`` (RK45).

    Parameters
    ----------
    x0 : array, shape (3,)
        Starting point.
    B_func : callable
        Returns B(x), shape (3,).  May be a compiled BiotSavartField or
        CombinedField (see their ``.compile()`` methods).
    length : float
        Total arc length to integrate.
    nsteps : int
        Number of integration steps (fixed-step) or max steps (adaptive).

    Returns
    -------
    line : array, shape (M, 3)
    """
    nd = getattr(B_func, "_numba_data", None)
    if nd is not None and _NUMBA_AVAILABLE:
        x0 = np.asarray(x0, dtype=np.float64)
        kind = nd[0]
        if kind == "bs":
            _, mids, wdl, eps = nd
            return _rk4_trace_bs(x0, mids, wdl, float(eps), float(length), int(nsteps))
        elif kind == "combined":
            _, mids, wdl, eps, B0, R0 = nd
            return _rk4_trace_combined(
                x0, mids, wdl, float(eps), float(B0), float(R0),
                float(length), int(nsteps),
            )

    sol = solve_ivp(
        lambda s, x: _fieldline_rhs(s, x, B_func),
        [0, length],
        x0,
        method='RK45',
        max_step=length / nsteps,
    )
    return sol.y.T


def trace_fieldlines(x0s, B_func, length=20.0, nsteps=2000, max_workers=None):
    """
    Trace multiple field lines in parallel.

    Uses processes (one per field line) to bypass the GIL and achieve
    true CPU parallelism. B_func must be picklable (dataclass instances
    and module-level functions work; lambdas and closures do not).

    When B_func has been compiled with ``.compile()``, each worker uses the
    fast Numba RK4 path.

    Parameters
    ----------
    x0s : sequence of array, each shape (3,)
        Starting points; results are returned in the same order.
    B_func : callable
        Returns B(x), shape (3,).
    length : float
        Total arc length per field line.
    nsteps : int
        Integration steps per field line.
    max_workers : int or None
        Process-pool size. None lets ProcessPoolExecutor choose.

    Returns
    -------
    lines : list of array, each shape (M, 3)
    """
    with ProcessPoolExecutor(max_workers=max_workers) as pool:
        futures = [
            pool.submit(trace_fieldline, x0, B_func, length, nsteps)
            for x0 in x0s
        ]
        return [f.result() for f in futures]
