from __future__ import annotations

import warnings
import numpy as np
from dataclasses import dataclass, field


@dataclass
class CurrentSegments:
    """A discretized current-carrying wire."""

    midpoints: np.ndarray  # shape (N, 3)
    dl: np.ndarray         # shape (N, 3)
    current: float = 1.0

    def field_at(self, x: np.ndarray, eps: float = 1e-9) -> np.ndarray:
        """Magnetic field contribution at observation point x."""
        x = np.asarray(x)
        r = x[None, :] - self.midpoints
        r2 = np.sum(r**2, axis=1) + eps**2
        r3 = r2 ** 1.5
        dB = self.current * np.cross(self.dl, r) / r3[:, None]
        return np.sum(dB, axis=0)


@dataclass
class BiotSavartField:
    """Superposition of magnetic fields from multiple current-segment sources."""

    sources: list[CurrentSegments] = field(default_factory=list)
    eps: float = 1e-4

    def __call__(self, x) -> np.ndarray:
        x = np.asarray(x, dtype=float)
        return sum(
            (src.field_at(x, eps=self.eps) for src in self.sources),
            np.zeros(3),
        )

    def compile(self) -> "BiotSavartField":
        """Pre-compute Numba-ready arrays for fast fixed-step RK4 integration.

        Returns self so calls can be chained:  field = BiotSavartField(...).compile()

        After calling compile(), pass this object to trace_fieldline / trace_fieldlines
        and the Numba path (~50–100× faster) is used automatically.  Falls back to
        solve_ivp if numba is not installed.
        """
        try:
            import numba  # noqa: F401
        except ImportError:
            warnings.warn(
                "numba is not installed; compile() has no effect. "
                "Install numba for 50–100× speedup: pip install numba",
                stacklevel=2,
            )
            return self

        midpoints = np.ascontiguousarray(
            np.concatenate([s.midpoints for s in self.sources]), dtype=np.float64
        )
        weighted_dl = np.ascontiguousarray(
            np.concatenate([s.dl * s.current for s in self.sources]), dtype=np.float64
        )
        self._numba_data = ("bs", midpoints, weighted_dl, float(self.eps))
        return self
