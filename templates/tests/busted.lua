#!/usr/bin/env -S nvim -l

vim.env.LAZY_STDPATH = ".tests"
load(vim.fn.system("curl -s https://raw.githubusercontent.com/folke/lazy.nvim/main/bootstrap.lua"))()

-- Setup lazy.nvim
require("lazy.minit").busted({
  spec = {
    { dir = vim.uv.cwd() },
    { "GeekVim/starter" },
    { "mason-org/mason-lspconfig.nvim" },
    { "mason-org/mason.nvim" },
    { "nvim-treesitter/nvim-treesitter" },
    { "echasnovski/mini.icons", opts = {} },
  },
})
