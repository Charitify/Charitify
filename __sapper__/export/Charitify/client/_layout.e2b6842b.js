import {
  S as s,
  i as t,
  s as e,
  H as n,
  c as $,
  j as a,
  n as c,
  p as o,
  r as l,
  u as r,
  I as p,
  J as u,
  K as f,
} from './client.a86515d4.js'

function i(s) {
  let t
  const e = s[0].default, n = p(e, s, s[1], null)
  return {
    c() {n && n.c()},
    l(s) {n && n.l(s)},
    m(s, e) {n && n.m(s, e), t = !0},
    p(s, t) {n && n.p && 2 & t && n.p(u(e, s, s[1], null), f(e, s[1], t, null))},
    i(s) {t || (o(n, s), t = !0)},
    o(s) {l(n, s), t = !1},
    d(s) {n && n.d(s)},
  }
}

function d(s) {
  let t
  const e = new n({ props: { $$slots: { default: [i] }, $$scope: { ctx: s } } })
  return {
    c() {$(e.$$.fragment)}, l(s) {a(e.$$.fragment, s)}, m(s, n) {c(e, s, n), t = !0}, p(s, [t]) {
      const n = {}
      2 & t && (n.$$scope = { dirty: t, ctx: s }), e.$set(n)
    }, i(s) {t || (o(e.$$.fragment, s), t = !0)}, o(s) {l(e.$$.fragment, s), t = !1}, d(s) {r(e, s)},
  }
}

function m(s, t, e) {
  let { $$slots: n = {}, $$scope: $ } = t
  return s.$set = s => {'$$scope' in s && e(1, $ = s.$$scope)}, [n, $]
}

export default class extends s {constructor(s) {super(), t(this, s, m, d, e, {})}}
